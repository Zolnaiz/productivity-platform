import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiveSLayout } from './entities/five-s-layout.entity';
import { TaskSource } from './entities/task.entity';
import { OperationsService } from './operations.service';
import { auditDueDate, auditTaskSourceId, isAuditDue, SchedulableZone } from './audit-schedule';

/**
 * Raises the audits a 5S programme is supposed to run.
 *
 * Every zone declares whether it is checked daily, weekly or monthly, and
 * until now nothing acted on it: the map could show a zone as overdue, but
 * only once somebody opened the page and pressed a button. A 5S programme that
 * depends on being remembered is the one that lapses.
 */
@Injectable()
export class AuditSchedulerService {
  private readonly logger = new Logger(AuditSchedulerService.name);

  constructor(
    @InjectRepository(FiveSLayout) private readonly layouts: Repository<FiveSLayout>,
    private readonly operations: OperationsService,
    private readonly configService: ConfigService,
  ) {}

  private get enabled() {
    return this.configService.get<boolean>('ENABLE_AUDIT_SCHEDULER', true);
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM, { name: 'five-s-audit-due' })
  async raiseDueAudits() {
    if (!this.enabled) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const layouts = await this.layouts.find();
    let due = 0;

    for (const layout of layouts) {
      // A layout belongs to one organization, so scoping falls out of the
      // iteration rather than having to be remembered per query.
      if (!layout.organizationId) {
        continue;
      }

      for (const zone of (layout.zones ?? []) as SchedulableZone[]) {
        if (!zone.id || !isAuditDue(zone, today)) {
          continue;
        }

        await this.ensureAuditTask(zone, layout.organizationId, today);
        due += 1;
      }
    }

    if (due) {
      this.logger.log(`Ensured audit tasks for ${due} due 5S zone(s)`);
    }
  }

  /**
   * Makes sure the zone has an open audit task.
   *
   * `createTask` returns the existing open task for a source rather than
   * making a second one, so running twice in a day — or on two instances at
   * once — raises nothing extra. The dedupe key matches the one the web app's
   * manual button uses, so the two cannot both raise the same audit.
   */
  private async ensureAuditTask(zone: SchedulableZone, organizationId: string, today: string) {
    const place = [zone.code, zone.name].filter(Boolean).join(' - ') || zone.id!;
    const dueDate = auditDueDate(zone) || today;

    await this.operations.createTask(
      {
        title: `5S audit due: ${place}`,
        description: [
          `Frequency: ${zone.auditFrequency ?? 'weekly'}`,
          `Last audit: ${zone.lastAuditAt ? zone.lastAuditAt.slice(0, 10) : 'never'}`,
          `Due: ${dueDate}`,
        ].join('\n'),
        assigneeId: zone.ownerId,
        sourceType: TaskSource.AUDIT_RUN,
        sourceId: auditTaskSourceId(zone.id!),
        priority: 'medium',
        dueDate,
        estimatedHours: 1,
        actualHours: 0,
      } as never,
      { organizationId },
    );
  }
}
