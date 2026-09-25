import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { ReportArchiveService } from './report-archive.service';
import { CloseMonthDto } from './dto/operations.dto';

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
  constructor(private readonly archive: ReportArchiveService) {}

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
