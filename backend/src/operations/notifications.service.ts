import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Notification, NotificationKind } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { MAILER, Mailer } from '../shared/mail/mailer';

type CurrentUser = { id?: string; organizationId?: string } | undefined;

export interface NotificationRequest {
  userId: string;
  organizationId?: string;
  kind?: NotificationKind;
  title: string;
  /** The title as a key and its parts, so an inbox reads in its own language. */
  titleKey?: string;
  titleParams?: Record<string, string | number>;
  body?: string;
  link?: string;
  sourceType?: string;
  sourceId?: string;
}

/** Postgres's code for a unique constraint, which is how a race is reported. */
const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';

/**
 * Telling somebody.
 *
 * Everything the application raises — an audit due at six in the morning, a
 * red-tag decision when a hold runs out, a task somebody assigns by hand — was
 * left in a list to be discovered. This is the other half: the work still
 * lives in its own table, and this says it exists, to one person, once.
 *
 * "Once" is the whole difficulty. The scheduler is designed to be safe to run
 * again, so it raises the same due audit every morning until it is done; if
 * each run notified, the inbox would be the last thing anybody read. The
 * source type and id make repetition harmless — the same event reaches the
 * same person exactly once, and the database is the arbiter rather than a
 * lookup that two replicas can both pass.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    /*
      The people, for their addresses. A notification is addressed by user id
      because that is what the rest of the application knows; an email needs
      the one thing the notification does not carry.
    */
    @InjectRepository(User) private readonly users: Repository<User>,
    @Inject(MAILER) private readonly mailer: Mailer,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Sends the same words to the person's address.
   *
   * Only for a notification that was just created — the dedupe above returns
   * the existing one without coming here — so an audit the scheduler re-raises
   * every morning is emailed once rather than daily.
   *
   * Everything is swallowed on purpose. The notification is the record; work
   * that was raised and not emailed is still raised, and an inbox that exists
   * inside the product is what somebody comes back to.
   */
  private async alsoByEmail(notification: Notification) {
    try {
      const recipient = await this.users.findOne({ where: { id: notification.userId } });

      if (!recipient?.email) return;

      const base = (this.configService.get<string>('APP_BASE_URL') ?? '').replace(/\/$/, '');

      await this.mailer.send({
        to: recipient.email,
        subject: notification.title,
        body: [
          notification.body,
          base ? `${base}${notification.link}` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      });
    } catch {
      this.logger.warn(`Could not email the notification for ${notification.userId}`);
    }
  }

  /**
   * Delivers one, unless this event already reached this person.
   *
   * Returns the notification either way, so a caller can say what happened
   * without asking again, and never throws into the path that raised the work:
   * failing to tell somebody about a task must not stop the task being made.
   */
  async notify(request: NotificationRequest) {
    if (!request.userId || !request.title) return null;

    const existing = await this.findBySource(request);
    if (existing) return existing;

    const notification = this.notifications.create({
      userId: request.userId,
      organizationId: request.organizationId,
      kind: request.kind ?? NotificationKind.TASK_ASSIGNED,
      title: request.title,
      titleKey: request.titleKey,
      titleParams: request.titleParams ?? {},
      body: request.body ?? '',
      link: request.link ?? '/tasks',
      sourceType: request.sourceType,
      sourceId: request.sourceId,
      readAt: null,
    });

    try {
      const saved = await this.notifications.save(notification);

      await this.alsoByEmail(saved);

      return saved;
    } catch (error) {
      // Two schedulers at six o'clock both passed the lookup above. Losing
      // that race means somebody else delivered it, which is the right outcome.
      if (isUniqueViolation(error)) {
        return (await this.findBySource(request)) ?? null;
      }

      this.logger.warn(`Could not deliver a notification to ${request.userId}`);
      return null;
    }
  }

  private findBySource(request: NotificationRequest) {
    if (!request.sourceType || !request.sourceId) return Promise.resolve(null);

    return this.notifications.findOne({
      where: {
        userId: request.userId,
        sourceType: request.sourceType,
        sourceId: request.sourceId,
      },
    });
  }

  /**
   * Somebody's own notifications, newest first.
   *
   * Scoped to the person asking and to nobody else: an inbox is personal, and
   * the organization is not a second key that could widen it.
   */
  findMine(user: CurrentUser, limit = 50) {
    if (!user?.id) return Promise.resolve([]);

    return this.notifications.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 200),
    });
  }

  countUnread(user: CurrentUser) {
    if (!user?.id) return Promise.resolve(0);

    return this.notifications.count({ where: { userId: user.id, readAt: IsNull() } });
  }

  /**
   * Marks one read.
   *
   * Scoped by recipient in the update itself rather than by reading the row
   * first and checking: a check and then a write is a window in which the
   * identifier can belong to somebody else.
   */
  async markRead(id: string, user: CurrentUser) {
    if (!user?.id) return { id, read: false };

    const result = await this.notifications.update({ id, userId: user.id }, { readAt: new Date() });

    return { id, read: Boolean(result.affected) };
  }

  async markAllRead(user: CurrentUser) {
    if (!user?.id) return { read: 0 };

    const result = await this.notifications.update(
      { userId: user.id, readAt: IsNull() },
      { readAt: new Date() },
    );

    return { read: result.affected ?? 0 };
  }
}
