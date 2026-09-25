import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { TaskStatus, WorkTask } from './entities/task.entity';
import { NotificationKind } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';
import { dayIn } from './task-completion';
import { Organization } from '../organizations/entities/organization.entity';
import { clockFrom } from './organization-clock';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../shared/constants';

/** How many tasks a reminder names before it says "and more". */
const NAMED = 5;

/** A list of tasks as data - titles and dates, no words - for the inbox to frame. */
const listOf = (tasks: WorkTask[]) => {
  const shown = tasks.slice(0, NAMED).map((task) => `- ${task.title} (${String(task.dueDate).slice(0, 10)})`);
  const rest = tasks.length - shown.length;

  return [...shown, rest > 0 ? `+${rest}` : ''].filter(Boolean).join('\n');
};

/** What a manager is told: the organization's late work and the due work with nobody on it. */
export interface TeamDigest {
  late: WorkTask[];
  unassigned: WorkTask[];
}

/** The roles that run other people's work, and so get the team's summary. */
const TEAM_ROLES = [UserRole.MANAGER, UserRole.ADMIN, UserRole.ORGANIZATION_ADMIN];

/**
 * The team's morning: work that is late, and work due by today that nobody
 * has. Backlog and finished work are left out, as for a person's own.
 */
export const teamDigestFor = (tasks: WorkTask[], today: string): TeamDigest => {
  const committed = tasks.filter(
    (task) => task.status !== TaskStatus.DONE && task.status !== TaskStatus.BACKLOG && task.dueDate,
  );
  const due = (task: WorkTask) => String(task.dueDate).slice(0, 10);

  return {
    late: committed
      .filter((task) => due(task) < today)
      .sort((a, b) => due(a).localeCompare(due(b))),
    unassigned: committed.filter((task) => !task.assigneeId && due(task) <= today),
  };
};

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
    // Read-only, for who runs the team and so gets its summary.
    @InjectRepository(User) private readonly users: Repository<User>,
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
        // Unassigned work too: nobody is reminded of it personally, which is
        // exactly why the manager's summary has to count it.
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
      const madeNow = (delivered: unknown) => {
        const createdAt = (delivered as { createdAt?: Date | string } | null)?.createdAt;
        return Boolean(createdAt && new Date(createdAt).getTime() >= runStartedAt - 1000);
      };

      for (const digest of digestsFor(theirs, today)) {
        if (madeNow(await this.notifications.notify(this.notificationFor(digest, today)))) sent += 1;
      }

      // The people who run the work get the team's picture, and only when
      // there is something in it to act on.
      const team = teamDigestFor(theirs, today);
      if (team.late.length || team.unassigned.length) {
        const managers = await this.users.find({
          where: { organizationId, role: In(TEAM_ROLES), isActive: true },
          select: { id: true },
        });
        for (const manager of managers) {
          if (madeNow(await this.notifications.notify(this.teamNotificationFor(team, manager.id, organizationId, today)))) {
            sent += 1;
          }
        }
      }
    }

    if (sent) {
      this.logger.log(`Reminded ${sent} person(s) of the day's work`);
    }

    return sent;
  }

  private teamNotificationFor(team: TeamDigest, userId: string, organizationId: string, today: string) {
    const late = team.late.length;
    const unassigned = team.unassigned.length;
    const named = [...team.unassigned, ...team.late.filter((task) => !team.unassigned.includes(task))].slice(0, NAMED);

    return {
      userId,
      organizationId,
      kind: NotificationKind.TEAM_DIGEST,
      title: `Team today: ${late} late, ${unassigned} with nobody on it`,
      titleKey: 'raised.teamDigest',
      titleParams: { late, unassigned },
      body: named
        .map((task) => `- ${task.title} (${String(task.dueDate).slice(0, 10)})${task.assigneeId ? '' : ' - nobody on it'}`)
        .join('\n'),
      // For the inbox: the two lists as data, the words around them from
      // the reader's locale.
      bodyKey: 'raised.teamDigestBody',
      bodyParams: {
        unassigned: listOf(team.unassigned) || '-',
        late: listOf(team.late.filter((task) => task.assigneeId)) || '-',
      },
      // The board is where late and unassigned work is dealt with.
      link: '/progress',
      sourceType: 'team_digest',
      sourceId: today,
    };
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
      bodyKey: 'raised.dailyDigestBody',
      bodyParams: { overdue: listOf(digest.overdue) || '-', dueToday: listOf(digest.dueToday) || '-' },
      link: '/tasks',
      sourceType: 'daily_digest',
      sourceId: today,
    };
  }
}
