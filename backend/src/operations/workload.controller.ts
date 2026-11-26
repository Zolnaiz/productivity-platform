/**
 * GET /workload (each person's load) and GET /workload/preview (what giving one more task would do), for
 * whoever assigns work (workload:read). Rules in workload.ts; queries in WorkloadService.
 */
import { BadRequestException, Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { WorkloadService } from './workload.service';

const isDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isId = (value: string) => /^[0-9a-fA-F-]{8,64}$/.test(value);

@ApiTags('workload')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller('workload')
export class WorkloadController {
  constructor(private readonly workload: WorkloadService) {}

  @Get()
  @RequirePermission('workload:read')
  @ApiOperation({ summary: 'Each person’s open work, hours this week and load level' })
  team(@Request() req) {
    return this.workload.team(req.user);
  }

  @Get('preview')
  @RequirePermission('workload:read')
  @ApiOperation({ summary: 'Load before and after giving one more task, with warnings, quietest person first' })
  preview(
    @Request() req,
    @Query('assigneeIds') assigneeIds?: string,
    @Query('dueDate') dueDate?: string,
    @Query('estimatedHours') estimatedHours?: string,
    @Query('taskId') taskId?: string,
  ) {
    const ids = assigneeIds ? assigneeIds.split(',').map((id) => id.trim()).filter(Boolean) : [];
    if (ids.some((id) => !isId(id)) || (taskId && !isId(taskId))) throw new BadRequestException('ids must be uuids');
    if (dueDate && !isDay(dueDate)) throw new BadRequestException('dueDate must be YYYY-MM-DD');
    const hours = estimatedHours === undefined || estimatedHours === '' ? undefined : Number(estimatedHours);
    if (hours !== undefined && (!Number.isFinite(hours) || hours < 0 || hours > 1000)) {
      throw new BadRequestException('estimatedHours must be a number of hours');
    }
    return this.workload.preview({ assigneeIds: ids, dueDate, estimatedHours: hours, taskId }, req.user);
  }
}
