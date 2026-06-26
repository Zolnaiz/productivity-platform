import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import {
  CreateAssessmentResponseDto,
  CreateAssessmentTemplateDto,
  CreateAuditRunDto,
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
  UpsertFiveSLayoutDto,
  UpdateProjectDto,
  UpdateTaskDto,
} from './dto/operations.dto';

@ApiTags('operations')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard)
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
  summary(@Request() req) {
    return this.operationsService.dashboardSummary(req.user);
  }

  @Get('operations/monthly-report')
  monthlyReport(@Request() req, @Query('month') month?: string) {
    return this.operationsService.monthlyReport(req.user, month);
  }

  @Get('projects')
  findProjects(@Request() req) {
    return this.operationsService.findProjects(req.user);
  }

  @Post('projects')
  createProject(@Body() body: CreateProjectDto, @Request() req) {
    return this.operationsService.createProject(body, req.user);
  }

  @Patch('projects/:id')
  updateProject(@Param('id') id: string, @Body() body: UpdateProjectDto, @Request() req) {
    return this.operationsService.updateProject(id, body, req.user);
  }

  @Delete('projects/:id')
  removeProject(@Param('id') id: string, @Request() req) {
    return this.operationsService.removeProject(id, req.user);
  }

  @Get('tasks')
  findTasks(@Query('projectId') projectId: string | undefined, @Request() req) {
    return this.operationsService.findTasks(req.user, projectId);
  }

  @Post('tasks')
  createTask(@Body() body: CreateTaskDto, @Request() req) {
    return this.operationsService.createTask(body, req.user);
  }

  @Patch('tasks/:id')
  updateTask(@Param('id') id: string, @Body() body: UpdateTaskDto, @Request() req) {
    return this.operationsService.updateTask(id, body, req.user);
  }

  @Get('work-logs')
  findWorkLogs(@Request() req) {
    return this.operationsService.findWorkLogs(req.user);
  }

  @Post('work-logs')
  createWorkLog(@Body() body: CreateWorkLogDto, @Request() req) {
    return this.operationsService.createWorkLog(body, req.user);
  }

  @Get('time-entries')
  findTimeEntries(@Request() req) {
    return this.operationsService.findTimeEntries(req.user);
  }

  @Post('time-entries')
  createTimeEntry(@Body() body: CreateTimeEntryDto, @Request() req) {
    return this.operationsService.createTimeEntry(this.toTimeEntryPayload(body), req.user);
  }

  @Get('daily-goals')
  findDailyGoals(@Request() req, @Query('date') date?: string) {
    return this.operationsService.findDailyGoals(req.user, date);
  }

  @Post('daily-goals')
  createDailyGoal(@Body() body: CreateDailyGoalDto, @Request() req) {
    return this.operationsService.createDailyGoal(body, req.user);
  }

  @Patch('daily-goals/:id')
  updateDailyGoal(@Param('id') id: string, @Body() body: UpdateDailyGoalDto, @Request() req) {
    return this.operationsService.updateDailyGoal(id, body, req.user);
  }

  @Get('five-s-layout')
  findFiveSLayout(@Request() req) {
    return this.operationsService.findFiveSLayout(req.user);
  }

  @Patch('five-s-layout')
  updateFiveSLayout(@Body() body: UpsertFiveSLayoutDto, @Request() req) {
    return this.operationsService.upsertFiveSLayout(body, req.user);
  }

  @Get('audit-templates')
  findAuditTemplates(@Request() req) {
    return this.operationsService.findAuditTemplates(req.user);
  }

  @Post('audit-templates')
  createAuditTemplate(@Body() body: CreateAuditTemplateDto, @Request() req) {
    return this.operationsService.createAuditTemplate(body, req.user);
  }

  @Get('audit-runs')
  findAuditRuns(@Request() req) {
    return this.operationsService.findAuditRuns(req.user);
  }

  @Post('audit-runs')
  createAuditRun(@Body() body: CreateAuditRunDto, @Request() req) {
    return this.operationsService.createAuditRun(body, req.user);
  }

  @Get('assessment-templates')
  findAssessmentTemplates(@Request() req) {
    return this.operationsService.findAssessmentTemplates(req.user);
  }

  @Post('assessment-templates')
  createAssessmentTemplate(@Body() body: CreateAssessmentTemplateDto, @Request() req) {
    return this.operationsService.createAssessmentTemplate(body, req.user);
  }

  @Patch('assessment-templates/:id')
  updateAssessmentTemplate(@Param('id') id: string, @Body() body: UpdateAssessmentTemplateDto, @Request() req) {
    return this.operationsService.updateAssessmentTemplate(id, body, req.user);
  }

  @Get('assessment-responses')
  findAssessmentResponses(@Request() req) {
    return this.operationsService.findAssessmentResponses(req.user);
  }

  @Post('assessment-responses')
  createAssessmentResponse(@Body() body: CreateAssessmentResponseDto, @Request() req) {
    return this.operationsService.createAssessmentResponse(this.toAssessmentResponsePayload(body), req.user);
  }

  @Patch('assessment-responses/:id')
  updateAssessmentResponse(@Param('id') id: string, @Body() body: UpdateAssessmentResponseDto, @Request() req) {
    return this.operationsService.updateAssessmentResponse(id, this.toAssessmentResponsePayload(body), req.user);
  }

  @Get('expenses')
  findExpenses(@Request() req) {
    return this.operationsService.findExpenses(req.user);
  }

  @Post('expenses')
  createExpense(@Body() body: CreateExpenseDto, @Request() req) {
    return this.operationsService.createExpense(body, req.user);
  }

  @Patch('expenses/:id')
  updateExpense(@Param('id') id: string, @Body() body: UpdateExpenseDto, @Request() req) {
    return this.operationsService.updateExpense(id, body, req.user);
  }
}
