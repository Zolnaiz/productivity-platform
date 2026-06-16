import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../shared/entities/user.entity';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportFilterDto } from './dto/report-filter.dto';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List reports', description: 'Get paginated reports' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['questionnaire', 'expense', 'combined'] })
  @ApiResponse({ status: 200, description: 'Reports returned successfully' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10, @Query('type') type?: string) {
    return this.reportsService.findAll({ page, limit, type });
  }

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate report', description: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report generated successfully' })
  @ApiResponse({ status: 400, description: 'Report generation failed' })
  async generateReport(@Body() generateReportDto: GenerateReportDto) {
    return this.reportsService.generateReport(generateReportDto);
  }

  @Post('generate/quick')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Generate quick report', description: 'Create an ad hoc report' })
  @ApiResponse({ status: 200, description: 'Quick report generated successfully' })
  async generateQuickReport(@Body() filterDto: ReportFilterDto) {
    return this.reportsService.generateQuickReport(filterDto);
  }

  @Get('dashboard/summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Report dashboard summary', description: 'Get report dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard summary returned successfully' })
  async getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('organization/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Organization reports', description: 'Get reports for an organization' })
  @ApiResponse({ status: 200, description: 'Organization reports returned successfully' })
  async getOrganizationReports(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getOrganizationReports(organizationId, startDate, endDate);
  }

  @Get('export/:id/:format')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Export report', description: 'Export a report by format' })
  @ApiResponse({ status: 200, description: 'Report exported successfully' })
  async exportReport(@Param('id') id: string, @Param('format') format: string) {
    return this.reportsService.exportReport(id, format);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get report by ID', description: 'Get report details' })
  @ApiResponse({ status: 200, description: 'Report returned successfully' })
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }
}
