import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';
import { TaskStatus, WorkTask } from './entities/task.entity';
import { NotificationKind } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { dayIn } from './task-completion';
import { Organization } from '../organizations/entities/organization.entity';
import { clockFrom } from './organization-clock';

/** How many tasks a reminder names before it says "and more". */
const NAMED = 5;

export interface PersonDigest {
  userId: string;
  organizationId?: string;
  dueToday: WorkTask[];
  overdue: WorkTask[];
}

export { dayIn };

/** The hour in a time zone, 0–23. */
export const hourIn = (timeZone: string, now: Date) =>
  Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now));

/**
 * Each person's work that is due today or already late.
 *
 * Backlog is left out: nobody has promised it, so it is not late. Finished
 * work is left out for the obvious reason.
 */
export const digestsFor = (tasks: WorkTask[], today: string): PersonDigest[] => {
  const byUser = new Map<string, PersonDigest>();

  for (const task of tasks) {
    const due = task.dueDate ? String(task.dueDate).slice(0, 10) : undefined;
    if (!task.assigneeId || !due || due > today) continue;
    if (task.status === TaskStatus.DONE || task.status === TaskStatus.BACKLOG) continue;

    const digest = byUser.get(task.assigneeId) ?? {
      userId: task.assigneeId,
      organizationId: task.organizationId,
      dueToday: [],
      overdue: [],
    };
    (due === today ? digest.dueToday : digest.overdue).push(task);
    byUser.set(task.assigneeId, digest);
  }

  for (const digest of byUser.values()) {
    // Most late first, so the line somebody reads first is the one that matters.
    digest.overdue.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  }

  return [...byUser.values()];
};

/**
 * Reminds each person, once in the morning, of what is due and what is late.
 *
 * A task was announced once, when it was given, and then left to be
 * remembered. That works for the task given this morning and fails for the
 * one given three weeks ago and due today — which is the one that matters.
 *
 * Runs hourly and sends at the first run after the configured hour, in the
 * organization's time zone rather than the server's: a container on UTC would
 * otherwise remind Ulaanbaatar at four in the afternoon. The day is the
 * notification's source, so a person gets at most one a day however many
 * times this runs, and a server that was down at eight still reminds at nine.
 */
@Injectable()
export class DailyReminderService {
  private readonly logger = new Logger(DailyReminderService.name);

  constructor(
    @InjectRepository(WorkTask) private readonly tasks: Repository<WorkTask>,
    // Read-only, for each organization's own time zone.
    @InjectRepository(Organization) private readonly organizations: Repository<Organization>,
    private readonly notifications: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  private get hour() {
    return Number(this.configService.get<number>('REMINDER_HOUR') ?? 8);
  }

  private get enabled() {
    return this.configService.get<boolean>('ENABLE_DAILY_REMINDERS', true);
  }

  @Cron('0 0 * * * *', { name: 'daily-work-reminder' })
  async remind(now = new Date()) {
    if (!this.enabled) {
      return 0;
    }

    // Each organization in its own morning. Mornings only: a reminder of the
    // day's work that arrives in the evening is noise, so a server that was
    // down all morning skips the day.
    const organizations = await this.organizations.find({ select: { id: true, settings: true } });
    const todayOf = new Map<string, string>();
    for (const organization of organizations) {
      const { timeZone } = clockFrom(organization.settings);
      const hour = hourIn(timeZone, now);
      if (hour >= this.hour && hour < 12) todayOf.set(organization.id, dayIn(timeZone, now));
    }

    if (!todayOf.size) {
      return 0;
    }

    // One query for all of them; the latest "today" bounds it, and each
    // organization's own day decides what is due and what is late.
    const latest = [...todayOf.values()].sort().pop() as string;
    const open = await this.tasks.find({
      where: {
        organizationId: In([...todayOf.keys()]),
        status: In([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW]),
        assigneeId: Not(IsNull()),
        dueDate: LessThanOrEqual(latest),
      },
    });

    // `notify` hands back the existing reminder when this person already had
    // today's, so only the ones made by this run count as sent — otherwise
    // the log would claim a fresh round of reminders every hour until noon.
    const runStartedAt = Date.now();
    let sent = 0;
    for (const [organizationId, today] of todayOf) {
      const theirs = open.filter((task) => task.organizationId === organizationId);
      for (const digest of digestsFor(theirs, today)) {
        const delivered = await this.notifications.notify(this.notificationFor(digest, today));
        const createdAt = (delivered as { createdAt?: Date | string } | null)?.createdAt;
        if (createdAt && new Date(createdAt).getTime() >= runStartedAt - 1000) sent += 1;
      }
    }

    if (sent) {
      this.logger.log(`Reminded ${sent} person(s) of the day's work`);
    }

    return sent;
  }

  private notificationFor(digest: PersonDigest, today: string) {
    const dueToday = digest.dueToday.length;
    const overdue = digest.overdue.length;
    const named = [...digest.overdue, ...digest.dueToday].slice(0, NAMED);
    const rest = dueToday + overdue - named.length;

    return {
      userId: digest.userId,
      organizationId: digest.organizationId,
      kind: NotificationKind.DAILY_DIGEST,
      // The sentence is for the email, which has no reader to ask; the inbox
      // words the key in the reader's language.
      title: `Today: ${dueToday} due, ${overdue} late`,
      titleKey: 'raised.dailyDigest',
      titleParams: { dueToday, overdue },
      body: [
        ...named.map((task) => `- ${task.title} (${String(task.dueDate).slice(0, 10)})`),
        rest > 0 ? `- and ${rest} more` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      link: '/tasks',
      sourceType: 'daily_digest',
      sourceId: today,
    };
  }
}
