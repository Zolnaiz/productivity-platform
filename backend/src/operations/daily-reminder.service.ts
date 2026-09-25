import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, Not, Repository } from 'typeorm';
import { TaskStatus, WorkTask } from './entities/task.entity';
import { NotificationKind } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { dayIn } from './task-completion';

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
    private readonly notifications: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  private get timeZone() {
    return this.configService.get<string>('APP_TIME_ZONE') || 'Asia/Ulaanbaatar';
  }

  private get hour() {
    return Number(this.configService.get<number>('REMINDER_HOUR') ?? 8);
  }

  private get enabled() {
    return this.configService.get<boolean>('ENABLE_DAILY_REMINDERS', true);
  }

  @Cron('0 0 * * * *', { name: 'daily-work-reminder' })
  async remind(now = new Date()) {
    const hour = hourIn(this.timeZone, now);

    // Mornings only: a reminder of the day's work that arrives in the evening
    // is noise, so a server that was down all morning skips the day.
    if (!this.enabled || hour < this.hour || hour >= 12) {
      return 0;
    }

    const today = dayIn(this.timeZone, now);
    const open = await this.tasks.find({
      where: {
        status: In([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW]),
        assigneeId: Not(IsNull()),
        dueDate: LessThanOrEqual(today),
      },
    });

    // `notify` hands back the existing reminder when this person already had
    // today's, so only the ones made by this run count as sent — otherwise
    // the log would claim a fresh round of reminders every hour until noon.
    const runStartedAt = Date.now();
    let sent = 0;
    for (const digest of digestsFor(open, today)) {
      const delivered = await this.notifications.notify(this.notificationFor(digest, today));
      const createdAt = (delivered as { createdAt?: Date | string } | null)?.createdAt;
      if (createdAt && new Date(createdAt).getTime() >= runStartedAt - 1000) sent += 1;
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
