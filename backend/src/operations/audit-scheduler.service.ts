import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FiveSLayout } from './entities/five-s-layout.entity';
import { Department } from './entities/department.entity';
import { User } from '../users/entities/user.entity';
import { assigneeForTier } from './tier-assignee';
import { TaskSource } from './entities/task.entity';
import { OperationsService } from './operations.service';
import { HeldRedTag, holdTaskSourceId, isHoldExpired, SchedulableZone } from './audit-schedule';
import {
  AuditTier,
  isTierDue,
  readAuditTiers,
  tierAuditOf,
  tierDueDate,
  TieredZone,
  tierTaskSourceId,
} from './audit-tiers';

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
    /*
      The people and the departments, to decide who a layer's check lands on.
      Read-only here: the scheduler raises work, it does not change anybody.
    */
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Department) private readonly departments: Repository<Department>,
    private readonly operations: OperationsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Who each layer's check should go to, for one zone.
   *
   * Looked up per zone rather than per organization because a plant's areas
   * belong to different departments, and the point of the exercise is that the
   * supervisor's check reaches that area's supervisor.
   */
  private async candidatesFor(zone: SchedulableZone) {
    /*
      The id comes from the plan and the role from the staff list, separately:
      a zone can name an owner whose row cannot be read — deleted, or simply
      not there yet in a workspace still being set up — and losing the
      assignment because of that would silently stop the work reaching
      anybody. Without a role they cover no layer that asks for one, which
      sends the higher layers to the department's manager as intended.
    */
    const ownerRecord = zone.ownerId
      ? await this.users.findOne({ where: { id: zone.ownerId } })
      : null;
    const owner = zone.ownerId ? { id: zone.ownerId, role: ownerRecord?.role } : null;

    const departmentId = (zone as { departmentId?: string }).departmentId;
    const department = departmentId
      ? await this.departments.findOne({ where: { id: departmentId } })
      : null;

    const departmentManager = department?.managerId
      ? await this.users.findOne({ where: { id: department.managerId } })
      : null;

    return { owner, departmentManager };
  }

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
    let expired = 0;

    for (const layout of layouts) {
      // A layout belongs to one organization, so scoping falls out of the
      // iteration rather than having to be remembered per query.
      if (!layout.organizationId) {
        continue;
      }

      const tiers = readAuditTiers((layout as { auditTiers?: unknown }).auditTiers);

      for (const zone of (layout.zones ?? []) as SchedulableZone[]) {
        if (!zone.id) {
          continue;
        }

        // Each layer runs on its own clock, so a zone can be up to date for
        // the operator and overdue for the manager at the same time.
        for (const tier of tiers) {
          if (!isTierDue(zone as TieredZone, tier, today)) {
            continue;
          }

          await this.ensureTierAuditTask(zone, tier, layout.organizationId, today);
          due += 1;
        }
      }

      expired += await this.ensureHoldDecisionTasks(layout, today);
    }

    if (due) {
      this.logger.log(`Ensured audit tasks for ${due} due 5S zone(s)`);
    }

    if (expired) {
      this.logger.log(`Ensured decision tasks for ${expired} expired red-tag hold(s)`);
    }
  }

  /**
   * Chases items whose stay in the holding area has run out.
   *
   * The point of the holding area is the wait: if nobody needed the item in a
   * month, that is the answer. But a list somebody has to remember to open is
   * how items go in and never come out.
   */
  private async ensureHoldDecisionTasks(layout: FiveSLayout, today: string) {
    let raised = 0;

    for (const zone of (layout.zones ?? []) as SchedulableZone & { redTags?: HeldRedTag[] }[]) {
      const area = zone as SchedulableZone & { redTags?: HeldRedTag[] };

      for (const redTag of area.redTags ?? []) {
        if (!redTag.id || !isHoldExpired(redTag, today)) {
          continue;
        }

        const place = [area.code, area.name].filter(Boolean).join(' - ') || area.id;

        await this.operations.createTask(
          {
            title: `Red-tag decision due: ${redTag.title ?? 'tagged item'}`,
            titleKey: 'raised.redTagDecision',
            titleParams: { item: redTag.title ?? 'tagged item' },
            description: [
              `Area: ${place}`,
              `Held since: ${redTag.heldAt ? redTag.heldAt.slice(0, 10) : 'not recorded'}`,
              'Decide whether the item is disposed of or returned to the area.',
            ].join('\n'),
            assigneeId: area.ownerId,
            sourceType: TaskSource.RED_TAG,
            sourceId: holdTaskSourceId(redTag.id),
            priority: 'medium',
            dueDate: today,
            estimatedHours: 1,
            actualHours: 0,
          } as never,
          { organizationId: layout.organizationId },
        );

        raised += 1;
      }
    }

    return raised;
  }

  /**
   * Makes sure this layer has an open audit task for this zone.
   *
   * `createTask` returns the existing open task for a source rather than
   * making a second one, so running twice in a day — or on two instances at
   * once — raises nothing extra. The key is distinct per tier, so the
   * operator's daily check and the supervisor's weekly one are two pieces of
   * work rather than one that keeps getting reused.
   */
  private async ensureTierAuditTask(
    zone: SchedulableZone,
    tier: AuditTier,
    organizationId: string,
    today: string,
  ) {
    const place = [zone.code, zone.name].filter(Boolean).join(' - ') || zone.id!;
    const lastAt = tierAuditOf(zone as TieredZone, tier.tier).lastAuditAt;
    const dueDate = tierDueDate(zone as TieredZone, tier) || today;
    const candidates = await this.candidatesFor(zone);

    await this.operations.createTask(
      {
        title: `${tier.name} 5S audit due: ${place}`,
        titleKey: 'raised.tierAuditDue',
        titleParams: { layer: tier.name, place },
        description: [
          `Layer: tier ${tier.tier} (${tier.name})`,
          `Frequency: ${tier.frequency}`,
          `Last checked at this layer: ${lastAt ? lastAt.slice(0, 10) : 'never'}`,
          `Due: ${dueDate}`,
        ].join('\n'),
        /*
          Whoever is expected to walk this layer. Every tier used to go to the
          zone owner, which put the supervisor's weekly check and the
          manager's monthly one in the operator's list — the one place they
          cannot be done from, and the opposite of what a layered audit is for.
        */
        assigneeId: assigneeForTier(tier, candidates),
        sourceType: TaskSource.AUDIT_RUN,
        sourceId: tierTaskSourceId(zone.id!, tier.tier),
        priority: tier.tier > 1 ? 'medium' : 'low',
        dueDate,
        estimatedHours: 1,
        actualHours: 0,
      } as never,
      { organizationId },
    );
  }
}
