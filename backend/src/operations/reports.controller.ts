import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { ReportArchiveService } from './report-archive.service';
import { CloseMonthDto } from './dto/operations.dto';
import { DraftSummaryDto, SaveSummaryDto } from './dto/monthly-summary.dto';
import { MonthlySummaryService } from './monthly-summary.service';

const isMonth = (value?: string): value is string => typeof value === 'string' && /^\d{4}-\d{2}$/.test(value);

/**
 * The monthly report, and the archive of closed months.
 *
 * A closed month is a resource of its own — created, listed, removed — so the
 * audit trail records which month was closed or reopened and by whom, the
 * way it records everything else.
 */
@ApiTags('operations')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller()
export class ReportsController {
  constructor(
    private readonly archive: ReportArchiveService,
    private readonly summaries: MonthlySummaryService,
  ) {}

  @Get('operations/monthly-summary')
  @RequirePermission('reports:read')
  monthlySummary(@Request() req, @Query('month') month?: string) {
    if (!isMonth(month)) throw new BadRequestException('month must be YYYY-MM');
    return this.summaries.find(req.user, month);
  }

  /** Asks Claude for a draft of the month's summary. */
  @Post('operations/monthly-summary/draft')
  @RequirePermission('reports:close')
  draftSummary(@Request() req, @Body() body: DraftSummaryDto) {
    return this.summaries.draft(req.user, body.month, body.language ?? 'mn');
  }

  @Put('operations/monthly-summary')
  @RequirePermission('reports:close')
  saveSummary(@Request() req, @Body() body: SaveSummaryDto) {
    return this.summaries.save(req.user, body.month, body.text, body.approve ?? false);
  }

  @Get('operations/monthly-report')
  @RequirePermission('reports:read')
  monthlyReport(@Request() req, @Query('month') month?: string) {
    return this.archive.monthlyReport(req.user, month);
  }

  /** A half-year or a year: `from` and `to` are months, YYYY-MM, at most twelve apart. */
  @Get('operations/period-report')
  @RequirePermission('reports:read')
  periodReport(@Request() req, @Query('from') from: string, @Query('to') to: string) {
    return this.archive.periodReport(req.user, from, to);
  }

  @Get('operations/monthly-closes')
  @RequirePermission('reports:read')
  listClosed(@Request() req) {
    return this.archive.listClosed(req.user);
  }

  @Post('operations/monthly-closes')
  @RequirePermission('reports:close')
  closeMonth(@Request() req, @Body() body: CloseMonthDto) {
    return this.archive.closeMonth(req.user, body.month);
  }

  /** `id` is the month, YYYY-MM, so the audit trail names it. */
  @Delete('operations/monthly-closes/:id')
  @RequirePermission('reports:reopen')
  reopenMonth(@Request() req, @Param('id') month: string) {
    return this.archive.reopenMonth(req.user, month);
  }
}
