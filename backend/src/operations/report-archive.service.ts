import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MonthlyReportClose } from './entities/monthly-report-close.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { OperationsService } from './operations.service';
import { buildMonthlyReport, MonthRecords, selectMonthRecords } from './monthly-report';
import { combineMonths, monthsBetween, PeriodMonth } from './period-report';
import { dayIn, organizationTimeZone } from './task-completion';
import { CLOSE_AFTER_DAY, clockFrom, OrganizationClock } from './organization-clock';
import { apiError, ErrorCode } from '../shared/errors/api-error';

type CurrentUser = { id?: string; role?: string; organizationId?: string } | undefined;

/** Postgres unique-violation. */
const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';

const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

/** YYYY-MM of the month before the one `today` is in, on a time zone's calendar. */
export const previousMonth = (today: Date, timeZone = organizationTimeZone()) => {
  const [year, month] = dayIn(timeZone, today).split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 2, 1));

  return first.toISOString().slice(0, 7);
};

export { CLOSE_AFTER_DAY, clockFrom };
export type { OrganizationClock };

/**
 * The archive of monthly reports.
 *
 * A month is live while it is open and frozen once it is closed: closing
 * stores the month's records, and from then on the report is read from that
 * copy. A manager can close a month as soon as it has ended; the scheduled
 * close does it on the fifth for anybody who did not, because an archive that
 * depends on somebody remembering is the one with gaps in it.
 */
@Injectable()
export class ReportArchiveService {
  private readonly logger = new Logger(ReportArchiveService.name);

  constructor(
    @InjectRepository(MonthlyReportClose) private readonly closes: Repository<MonthlyReportClose>,
    // Read-only, to know which organizations have a month to close.
    @InjectRepository(Organization) private readonly organizations: Repository<Organization>,
    private readonly operations: OperationsService,
    private readonly configService: ConfigService,
  ) {}

  private async clockOf(organizationId: string | undefined): Promise<OrganizationClock> {
    if (!organizationId) return clockFrom(null);

    const organization = await this.organizations.findOne({
      where: { id: organizationId },
      select: { id: true, settings: true },
    });

    return clockFrom(organization?.settings);
  }

  private findClose(organizationId: string | undefined, period: string) {
    if (!organizationId) return Promise.resolve(null);

    return this.closes.findOne({ where: { organizationId, period } });
  }

  /** The month's report: from its stored records when closed, live when not. */
  async monthlyReport(user: CurrentUser, month?: string) {
    const { timeZone } = await this.clockOf(user?.organizationId);
    const period = monthPattern.test(month || '') ? (month as string) : dayIn(timeZone, new Date()).slice(0, 7);
    const closed = await this.findClose(user?.organizationId, period);
    const viewer = { id: user?.id, ownOnly: user?.role === 'user' };

    if (!closed) {
      const records = await this.operations.monthRecords(user, period, timeZone);
      return { ...buildMonthlyReport(records, period, viewer, timeZone), closed: null };
    }

    const report = buildMonthlyReport(closed.records as unknown as MonthRecords, period, viewer, timeZone);

    return { ...report, closed: { at: closed.createdAt, by: closed.closedBy ?? null } };
  }

  /**
   * A half-year or a year, from its months.
   *
   * Closed months are read from their stored records and open ones live, so
   * the year agrees with every monthly report that was signed off. The live
   * tables are read once for all the open months, not once per month.
   */
  async periodReport(user: CurrentUser, from: string, to: string) {
    const periods = monthsBetween(from, to);
    if (!periods.length) {
      throw apiError(ErrorCode.ValidationFailed, 'from, to');
    }

    const organizationId = user?.organizationId;
    const { timeZone } = await this.clockOf(organizationId);
    const closes = organizationId
      ? await this.closes.find({ where: { organizationId, period: In(periods) } })
      : [];
    const closedBy = new Map(closes.map((close) => [close.period, close]));
    const live = periods.some((period) => !closedBy.has(period))
      ? await this.operations.organizationRecords(user)
      : null;
    const viewer = { id: user?.id, ownOnly: user?.role === 'user' };

    const months: PeriodMonth[] = periods.map((period) => {
      const closed = closedBy.get(period);
      const records = closed
        ? (closed.records as unknown as MonthRecords)
        : selectMonthRecords(live as NonNullable<typeof live>, period, timeZone);

      return {
        ...buildMonthlyReport(records, period, viewer, timeZone),
        closed: closed ? { at: closed.createdAt, by: closed.closedBy ?? null } : null,
      };
    });

    return combineMonths(periods[0], periods[periods.length - 1], months);
  }

  /** The months that have been closed, newest first, without their records. */
  async listClosed(user: CurrentUser) {
    if (!user?.organizationId) return [];

    const rows = await this.closes.find({
      where: { organizationId: user.organizationId },
      select: { id: true, period: true, closedBy: true, createdAt: true },
      order: { period: 'DESC' },
    });

    return rows.map((row) => ({ period: row.period, closedAt: row.createdAt, closedBy: row.closedBy ?? null }));
  }

  /**
   * Freezes a month that has ended.
   *
   * Closing one that is still running would freeze a report with a week of
   * work missing from it, and nothing on the page would say so.
   */
  async closeMonth(user: CurrentUser, month: string, now = new Date()) {
    if (!monthPattern.test(month || '')) {
      throw apiError(ErrorCode.ValidationFailed, 'month');
    }

    const organizationId = user?.organizationId;
    if (!organizationId) {
      throw apiError(ErrorCode.AuthOrganizationRequired);
    }

    // Ended on the organization's calendar: at 07:00 on the first in
    // Ulaanbaatar the old month is over, whatever UTC still says.
    const { timeZone } = await this.clockOf(organizationId);
    if (month >= dayIn(timeZone, now).slice(0, 7)) {
      throw apiError(ErrorCode.ReportMonthNotEnded);
    }

    await this.freeze(organizationId, month, timeZone, user?.id);

    return this.monthlyReport(user, month);
  }

  /**
   * Opens a closed month again, so it is counted live.
   *
   * For the correction nobody saw in time. The copy that was closed is kept,
   * soft-deleted, so what people were shown before the correction can still
   * be found.
   */
  async reopenMonth(user: CurrentUser, month: string) {
    const closed = await this.findClose(user?.organizationId, month);

    if (!closed) {
      throw apiError(ErrorCode.ResourceNotFound, 'Closed month');
    }

    await this.closes.softRemove(closed);

    return this.monthlyReport(user, month);
  }

  private async freeze(organizationId: string, period: string, timeZone: string, closedBy?: string) {
    const existing = await this.findClose(organizationId, period);
    if (existing) return existing;

    const records = await this.operations.monthRecords({ organizationId }, period, timeZone);

    try {
      return await this.closes.save(
        this.closes.create({
          organizationId,
          period,
          closedBy,
          records: records as unknown as Record<string, unknown>,
        }),
      );
    } catch (error) {
      // Somebody closed it between the lookup and the write — the scheduled
      // close and a manager's button, most likely. Theirs stands.
      if (isUniqueViolation(error)) return this.findClose(organizationId, period);

      throw error;
    }
  }

  private get enabled() {
    return this.configService.get<boolean>('ENABLE_MONTH_CLOSE', true);
  }

  /**
   * Closes last month for every organization that has not closed it.
   *
   * Each organization on its own clock: its time zone decides which month has
   * ended and its close day when. Runs hourly rather than once, so a server
   * that was down that morning closes the month the next time it is up.
   */
  @Cron('0 15 * * * *', { name: 'monthly-report-close' })
  async closePreviousMonth(now = new Date()) {
    if (!this.enabled) {
      return;
    }

    const organizations = await this.organizations.find({ select: { id: true, settings: true } });
    let closed = 0;

    for (const organization of organizations) {
      const { timeZone, closeDay } = clockFrom(organization.settings);
      if (Number(dayIn(timeZone, now).slice(8, 10)) < closeDay) continue;

      const period = previousMonth(now, timeZone);

      try {
        const existing = await this.findClose(organization.id, period);
        if (existing) continue;

        await this.freeze(organization.id, period, timeZone);
        closed += 1;
      } catch (error) {
        // One organization's failure must not leave everybody else's month open.
        this.logger.error(`Could not close ${period} for ${organization.id}: ${(error as Error).message}`);
      }
    }

    if (closed) {
      this.logger.log(`Closed last month for ${closed} organization(s)`);
    }
  }
}
