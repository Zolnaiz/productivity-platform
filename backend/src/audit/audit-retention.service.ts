import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AuditLogEntry } from './entities/audit-log-entry.entity';

/**
 * Two years, because that is the span somebody actually looks back over.
 *
 * A quality programme is reviewed annually and argued about the year after,
 * so a year is too short; beyond two, nobody has asked a question the trail
 * answers, and the rows are cost rather than evidence.
 */
export const DEFAULT_RETENTION_DAYS = 730;

/**
 * How long a row is kept, read from configuration.
 *
 * Zero means keep everything, stated rather than implied: an organization
 * whose regulator requires it should be able to say so, and should have to say
 * so rather than get it by leaving a value unset.
 */
export const retentionDays = (raw: unknown) => {
  // Unset is not zero. `Number(null)` is 0, so reading an absent setting
  // straight through a cast would quietly mean "keep everything for ever" —
  // the opposite of a default, arrived at by nobody deciding anything.
  if (raw === null || raw === undefined || raw === '') return DEFAULT_RETENTION_DAYS;

  const value = Number(raw);

  if (!Number.isFinite(value) || value < 0) return DEFAULT_RETENTION_DAYS;

  return Math.floor(value);
};

export const cutoffFor = (days: number, now = new Date()) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

/**
 * Keeps the trail from growing without end.
 *
 * Every accepted change writes a row and nothing removed one, which is correct
 * for evidence and unbounded for a database: an organization doing its job —
 * auditing zones daily, closing red tags, logging hours — writes thousands a
 * month, for ever.
 *
 * Deleting rather than archiving, deliberately. An archive nobody can read is
 * the same as a deletion with extra cost and a false sense of safety; if these
 * rows need to outlive the database, they need somewhere to go that is not
 * this table, and that is a decision to take on purpose rather than by
 * accumulating.
 */
@Injectable()
export class AuditRetentionService {
  private readonly logger = new Logger(AuditRetentionService.name);

  constructor(
    @InjectRepository(AuditLogEntry) private readonly entries: Repository<AuditLogEntry>,
    private readonly configService: ConfigService,
  ) {}

  get days() {
    return retentionDays(this.configService.get('AUDIT_LOG_RETENTION_DAYS'));
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'audit-log-retention' })
  async removeExpiredEntries() {
    const days = this.days;

    if (!days) {
      return 0;
    }

    const cutoff = cutoffFor(days);

    try {
      const result = await this.entries.delete({ createdAt: LessThan(cutoff) });
      const removed = result.affected ?? 0;

      if (removed) {
        this.logger.log(`Removed ${removed} audit entr(ies) older than ${days} days`);
      }

      return removed;
    } catch (error) {
      // Housekeeping that fails is a warning, not an outage: the trail keeps
      // being written, and the next night tries again.
      this.logger.warn(`Audit retention pass failed: ${(error as Error).message}`);

      return 0;
    }
  }
}
