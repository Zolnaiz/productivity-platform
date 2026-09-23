import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import {
  CreateAssessmentResponseDto,
  CreateAssessmentTemplateDto,
  CreateAuditRunDto,
  CreateDepartmentDto,
  SaveFiveSGuidelineRecordsDto,
  UpdateDepartmentDto,
  CreateAuditTemplateDto,
  CreateDailyGoalDto,
  CreateExpenseDto,
  CreateProjectDto,
  CreateTaskDto,
  CreateTimeEntryDto,
  CreateWorkLogDto,
  UpdateAssessmentResponseDto,
  UpdateAssessmentTemplateDto,
  UpdateDailyGoalDto,
  UpdateExpenseDto,
  CreateFiveSLayoutDto,
  CreateRedTagDto,
  UpsertFiveSLayoutDto,
  UpdateProjectDto,
  UpdateTaskDto,
} from './dto/operations.dto';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../shared/guards/permissions.guard';

@ApiTags('operations')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller()
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  private toTimeEntryPayload(body: CreateTimeEntryDto) {
    return {
      ...body,
      startedAt: body.startedAt ? new Date(body.startedAt) : undefined,
      endedAt: body.endedAt ? new Date(body.endedAt) : undefined,
    };
  }

  private toAssessmentResponsePayload(body: CreateAssessmentResponseDto | UpdateAssessmentResponseDto) {
    return {
      ...body,
      submittedAt: body.submittedAt ? new Date(body.submittedAt) : undefined,
    };
  }

  @Get('operations/summary')
  @RequirePermission('reports:read')
  summary(@Request() req) {
    return this.operationsService.dashboardSummary(req.user);
  }

  @Get('operations/monthly-report')
  @RequirePermission('reports:read')
  monthlyReport(@Request() req, @Query('month') month?: string) {
    return this.operationsService.monthlyReport(req.user, month);
  }

  @Get('projects')
  @RequirePermission('projects:read')
  findProjects(@Request() req) {
    return this.operationsService.findProjects(req.user);
  }

  @Post('projects')
  @RequirePermission('projects:create')
  createProject(@Body() body: CreateProjectDto, @Request() req) {
    return this.operationsService.createProject(body, req.user);
  }

  @Patch('projects/:id')
  @RequirePermission('projects:update')
  updateProject(@Param('id') id: string, @Body() body: UpdateProjectDto, @Request() req) {
    return this.operationsService.updateProject(id, body, req.user);
  }

  @Delete('projects/:id')
  @RequirePermission('projects:delete')
  removeProject(@Param('id') id: string, @Request() req) {
    return this.operationsService.removeProject(id, req.user);
  }

  @Get('tasks')
  @RequirePermission('tasks:read')
  findTasks(@Query('projectId') projectId: string | undefined, @Request() req) {
    return this.operationsService.findTasks(req.user, projectId);
  }

  @Post('tasks')
  @RequirePermission('tasks:create')
  createTask(@Body() body: CreateTaskDto, @Request() req) {
    return this.operationsService.createTask(body, req.user);
  }

  @Patch('tasks/:id')
  @RequirePermission('tasks:update')
  updateTask(@Param('id') id: string, @Body() body: UpdateTaskDto, @Request() req) {
    return this.operationsService.updateTask(id, body, req.user);
  }

  @Get('work-logs')
  @RequirePermission('worklogs:read')
  findWorkLogs(@Request() req) {
    return this.operationsService.findWorkLogs(req.user);
  }

  @Post('work-logs')
  @RequirePermission('worklogs:create')
  createWorkLog(@Body() body: CreateWorkLogDto, @Request() req) {
    return this.operationsService.createWorkLog(body, req.user);
  }

  @Get('time-entries')
  @RequirePermission('time:read')
  findTimeEntries(@Request() req) {
    return this.operationsService.findTimeEntries(req.user);
  }

  @Post('time-entries')
  @RequirePermission('time:create')
  createTimeEntry(@Body() body: CreateTimeEntryDto, @Request() req) {
    return this.operationsService.createTimeEntry(this.toTimeEntryPayload(body), req.user);
  }

  @Get('daily-goals')
  @RequirePermission('goals:read')
  findDailyGoals(@Request() req, @Query('date') date?: string) {
    return this.operationsService.findDailyGoals(req.user, date);
  }

  @Post('daily-goals')
  @RequirePermission('goals:create')
  createDailyGoal(@Body() body: CreateDailyGoalDto, @Request() req) {
    return this.operationsService.createDailyGoal(body, req.user);
  }

  @Patch('daily-goals/:id')
  @RequirePermission('goals:update')
  updateDailyGoal(@Param('id') id: string, @Body() body: UpdateDailyGoalDto, @Request() req) {
    return this.operationsService.updateDailyGoal(id, body, req.user);
  }

  /**
   * Every plan the organization has — one per floor of one per building.
   *
   * The singular routes below stay: they mean "the organization's plan", which
   * is what a client written before there were several means by it, and what a
   * workspace with one floor still means by it.
   */
  @Get('five-s-layouts')
  @RequirePermission('zones:read')
  findFiveSLayouts(@Request() req) {
    return this.operationsService.findFiveSLayouts(req.user);
  }

  @Post('five-s-layouts')
  @RequirePermission('zones:create')
  createFiveSLayout(@Body() body: CreateFiveSLayoutDto, @Request() req) {
    return this.operationsService.createFiveSLayout(body, req.user);
  }

  @Patch('five-s-layouts/:id')
  @RequirePermission('zones:update')
  updateFiveSLayoutById(@Param('id') id: string, @Body() body: UpsertFiveSLayoutDto, @Request() req) {
    return this.operationsService.upsertFiveSLayout(body, req.user, id);
  }

  @Delete('five-s-layouts/:id')
  @RequirePermission('zones:delete')
  deleteFiveSLayout(@Param('id') id: string, @Request() req) {
    return this.operationsService.deleteFiveSLayout(id, req.user);
  }

  /**
   * Raising a red tag from the floor.
   *
   * Its own route and its own permission rather than a plan update, so the
   * person who finds the clutter can say so without being able to redraw the
   * building.
   */
  @Post('five-s-layouts/:planId/zones/:zoneId/red-tags')
  @RequirePermission('redtags:create')
  addRedTag(
    @Param('planId') planId: string,
    @Param('zoneId') zoneId: string,
    @Body() body: CreateRedTagDto,
    @Request() req,
  ) {
    return this.operationsService.addRedTag(planId, zoneId, body, req.user);
  }

  /**
   * Marking an area cleaned, from wherever it was cleaned.
   *
   * No body: there is nothing to say beyond that it happened, and a route
   * that takes nothing cannot be used to write anything else.
   */
  @Post('five-s-layouts/:planId/zones/:zoneId/cleaned')
  @RequirePermission('zones:clean')
  markZoneCleaned(@Param('planId') planId: string, @Param('zoneId') zoneId: string, @Request() req) {
    return this.operationsService.markZoneCleaned(planId, zoneId, req.user);
  }

  @Get('five-s-layout')
  @RequirePermission('zones:read')
  findFiveSLayout(@Request() req, @Query('id') id?: string) {
    return this.operationsService.findFiveSLayout(req.user, id);
  }

  @Patch('five-s-layout')
  @RequirePermission('zones:update')
  updateFiveSLayout(@Body() body: UpsertFiveSLayoutDto, @Request() req) {
    return this.operationsService.upsertFiveSLayout(body, req.user);
  }

  @Get('audit-templates')
  @RequirePermission('templates:read')
  findAuditTemplates(@Request() req) {
    return this.operationsService.findAuditTemplates(req.user);
  }

  @Post('audit-templates')
  @RequirePermission('templates:create')
  createAuditTemplate(@Body() body: CreateAuditTemplateDto, @Request() req) {
    return this.operationsService.createAuditTemplate(body, req.user);
  }

  /*
    Departments: the shape of the organization. Everybody reads it, because a
    page that cannot name the department answerable for an area is a worse
    answer than one that can; changing it is an administrator's job.
  */
  @Get('departments')
  @RequirePermission('departments:read')
  findDepartments(@Request() req) {
    return this.operationsService.findDepartments(req.user);
  }

  @Post('departments')
  @RequirePermission('departments:create')
  createDepartment(@Body() body: CreateDepartmentDto, @Request() req) {
    return this.operationsService.createDepartment(body, req.user);
  }

  @Patch('departments/:id')
  @RequirePermission('departments:update')
  updateDepartment(@Param('id') id: string, @Body() body: UpdateDepartmentDto, @Request() req) {
    return this.operationsService.updateDepartment(id, body, req.user);
  }

  @Delete('departments/:id')
  @RequirePermission('departments:delete')
  removeDepartment(@Param('id') id: string, @Request() req) {
    return this.operationsService.removeDepartment(id, req.user);
  }

  /*
    The 5S register: the standard an organization works to, and what its people
    have filled in against it. Kept in the browser that typed it until now,
    which made a programme's memory somebody's laptop.
  */
  @Get('five-s-guidelines')
  @RequirePermission('guidelines:read')
  findFiveSGuideline(@Request() req) {
    return this.operationsService.findFiveSGuideline(req.user);
  }

  @Patch('five-s-guidelines')
  @RequirePermission('guidelines:update')
  saveFiveSGuidelineRecords(@Body() body: SaveFiveSGuidelineRecordsDto, @Request() req) {
    return this.operationsService.saveFiveSGuidelineRecords(body.records, req.user);
  }

  @Get('audit-runs')
  @RequirePermission('audits:read')
  findAuditRuns(@Request() req, @Query('zoneId') zoneId?: string) {
    return this.operationsService.findAuditRuns(req.user, zoneId);
  }

  @Post('audit-runs')
  @RequirePermission('audits:create')
  createAuditRun(@Body() body: CreateAuditRunDto, @Request() req) {
    return this.operationsService.createAuditRun(body, req.user);
  }

  /**
   * Chasing a failing run that raised no work, or raised it long ago.
   *
   * Recording a run already raises its own follow-up, so this is for the runs
   * that predate that and for an area that has not improved. `tasks:create`
   * rather than `audits:create`: walking a checklist is open to the floor,
   * deciding that somebody is given work is not.
   */
  @Post('audit-runs/:id/follow-up')
  @RequirePermission('tasks:create')
  raiseAuditFollowUp(@Param('id') id: string, @Request() req) {
    return this.operationsService.raiseAuditFollowUp(id, req.user);
  }

  @Get('assessment-templates')
  @RequirePermission('templates:read')
  findAssessmentTemplates(@Request() req) {
    return this.operationsService.findAssessmentTemplates(req.user);
  }

  @Post('assessment-templates')
  @RequirePermission('templates:create')
  createAssessmentTemplate(@Body() body: CreateAssessmentTemplateDto, @Request() req) {
    return this.operationsService.createAssessmentTemplate(body, req.user);
  }

  @Patch('assessment-templates/:id')
  @RequirePermission('templates:update')
  updateAssessmentTemplate(@Param('id') id: string, @Body() body: UpdateAssessmentTemplateDto, @Request() req) {
    return this.operationsService.updateAssessmentTemplate(id, body, req.user);
  }

  @Get('assessment-responses')
  @RequirePermission('audits:read')
  findAssessmentResponses(@Request() req) {
    return this.operationsService.findAssessmentResponses(req.user);
  }

  @Post('assessment-responses')
  @RequirePermission('audits:create')
  createAssessmentResponse(@Body() body: CreateAssessmentResponseDto, @Request() req) {
    return this.operationsService.createAssessmentResponse(this.toAssessmentResponsePayload(body), req.user);
  }

  @Patch('assessment-responses/:id')
  @RequirePermission('audits:update')
  updateAssessmentResponse(@Param('id') id: string, @Body() body: UpdateAssessmentResponseDto, @Request() req) {
    return this.operationsService.updateAssessmentResponse(id, this.toAssessmentResponsePayload(body), req.user);
  }

  @Get('expenses')
  @RequirePermission('expenses:read')
  findExpenses(@Request() req) {
    return this.operationsService.findExpenses(req.user);
  }

  @Post('expenses')
  @RequirePermission('expenses:create')
  createExpense(@Body() body: CreateExpenseDto, @Request() req) {
    return this.operationsService.createExpense(body, req.user);
  }

  @Patch('expenses/:id')
  @RequirePermission('expenses:update')
  updateExpense(@Param('id') id: string, @Body() body: UpdateExpenseDto, @Request() req) {
    return this.operationsService.updateExpense(id, body, req.user);
  }
}
