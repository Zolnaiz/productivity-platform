import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OperationsService } from './operations.service';
import { OperationsAuthGuard } from './guards/operations-auth.guard';

@ApiTags('operations')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard)
@Controller()
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get('operations/summary')
  summary(@Request() req) {
    return this.operationsService.dashboardSummary(req.user);
  }

  @Get('operations/monthly-report')
  monthlyReport(@Request() req) {
    return this.operationsService.monthlyReport(req.user);
  }

  @Get('projects')
  findProjects(@Request() req) {
    return this.operationsService.findProjects(req.user);
  }

  @Post('projects')
  createProject(@Body() body, @Request() req) {
    return this.operationsService.createProject(body, req.user);
  }

  @Patch('projects/:id')
  updateProject(@Param('id') id: string, @Body() body, @Request() req) {
    return this.operationsService.updateProject(id, body, req.user);
  }

  @Get('tasks')
  findTasks(@Query('projectId') projectId: string | undefined, @Request() req) {
    return this.operationsService.findTasks(req.user, projectId);
  }

  @Post('tasks')
  createTask(@Body() body, @Request() req) {
    return this.operationsService.createTask(body, req.user);
  }

  @Patch('tasks/:id')
  updateTask(@Param('id') id: string, @Body() body, @Request() req) {
    return this.operationsService.updateTask(id, body, req.user);
  }

  @Get('work-logs')
  findWorkLogs(@Request() req) {
    return this.operationsService.findWorkLogs(req.user);
  }

  @Post('work-logs')
  createWorkLog(@Body() body, @Request() req) {
    return this.operationsService.createWorkLog(body, req.user);
  }

  @Get('time-entries')
  findTimeEntries(@Request() req) {
    return this.operationsService.findTimeEntries(req.user);
  }

  @Post('time-entries')
  createTimeEntry(@Body() body, @Request() req) {
    return this.operationsService.createTimeEntry(body, req.user);
  }

  @Get('audit-templates')
  findAuditTemplates(@Request() req) {
    return this.operationsService.findAuditTemplates(req.user);
  }

  @Post('audit-templates')
  createAuditTemplate(@Body() body, @Request() req) {
    return this.operationsService.createAuditTemplate(body, req.user);
  }

  @Get('audit-runs')
  findAuditRuns(@Request() req) {
    return this.operationsService.findAuditRuns(req.user);
  }

  @Post('audit-runs')
  createAuditRun(@Body() body, @Request() req) {
    return this.operationsService.createAuditRun(body, req.user);
  }

  @Get('assessment-templates')
  findAssessmentTemplates(@Request() req) {
    return this.operationsService.findAssessmentTemplates(req.user);
  }

  @Post('assessment-templates')
  createAssessmentTemplate(@Body() body, @Request() req) {
    return this.operationsService.createAssessmentTemplate(body, req.user);
  }

  @Patch('assessment-templates/:id')
  updateAssessmentTemplate(@Param('id') id: string, @Body() body, @Request() req) {
    return this.operationsService.updateAssessmentTemplate(id, body, req.user);
  }

  @Get('assessment-responses')
  findAssessmentResponses(@Request() req) {
    return this.operationsService.findAssessmentResponses(req.user);
  }

  @Post('assessment-responses')
  createAssessmentResponse(@Body() body, @Request() req) {
    return this.operationsService.createAssessmentResponse(body, req.user);
  }

  @Patch('assessment-responses/:id')
  updateAssessmentResponse(@Param('id') id: string, @Body() body, @Request() req) {
    return this.operationsService.updateAssessmentResponse(id, body, req.user);
  }

  @Get('expenses')
  findExpenses(@Request() req) {
    return this.operationsService.findExpenses(req.user);
  }

  @Post('expenses')
  createExpense(@Body() body, @Request() req) {
    return this.operationsService.createExpense(body, req.user);
  }

  @Patch('expenses/:id')
  updateExpense(@Param('id') id: string, @Body() body, @Request() req) {
    return this.operationsService.updateExpense(id, body, req.user);
  }
}
