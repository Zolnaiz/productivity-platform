import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogEntry } from './entities/audit-log-entry.entity';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { ChangeSummary } from './change-summary';

export interface RecordableAction {
  organizationId: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  module: string;
  action: string;
  targetId?: string;
  method: string;
  route: string;
  statusCode: number;
  severity: AuditLogEntry['severity'];
  /** A summary of what the request asked to change; see `change-summary.ts`. */
  changes?: ChangeSummary | null;
  /** What those fields held before, when the service could say; see `audit-context.ts`. */
  before?: ChangeSummary | null;
}

/**
 * Reading and writing the record of who changed what.
 *
 * There is no update and no delete, because the table is evidence. The only
 * write is `record`, and the only read is one organization's own entries.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLogEntry) private readonly entries: Repository<AuditLogEntry>,
  ) {}

  /**
   * Writes one entry, and never fails the action it is describing.
   *
   * A request that succeeded must not be reported as failed because the
   * bookkeeping behind it did. A write that does not land is logged loudly so
   * the gap is visible rather than silent.
   */
  async record(action: RecordableAction) {
    try {
      return await this.entries.save(this.entries.create(action));
    } catch (error) {
      this.logger.error(
        `Audit entry not written for ${action.method} ${action.route}: ${(error as Error).message}`,
      );

      return null;
    }
  }

  /** One organization's entries, newest first. */
  async findForOrganization(organizationId: string | undefined, limit = 100) {
    if (!organizationId) {
      throw apiError(ErrorCode.AuthOrganizationRequired);
    }

    return this.entries.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: Math.min(500, Math.max(1, limit)),
    });
  }
}
