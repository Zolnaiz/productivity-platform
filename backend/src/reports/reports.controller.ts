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
  @ApiOperation({ summary: 'Тайлангийн жагсаалт', description: 'Бүх тайлангийн жагсаалт авах' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['questionnaire', 'expense', 'combined'] })
  @ApiResponse({ status: 200, description: 'Тайлангийн жагсаалт амжилттай авлаа' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('type') type?: string,
  ) {
    return this.reportsService.findAll({ page, limit, type });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Тайлан дэлгэрэнгүй', description: 'Тайлангийн дэлгэрэнгүй мэдээлэл авах' })
  @ApiResponse({ status: 200, description: 'Тайлангийн дэлгэрэнгүй амжилттай авлаа' })
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post('generate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Тайлан үүсгэх', description: 'Шинэ тайлан үүсгэх' })
  @ApiResponse({ status: 201, description: 'Тайлан амжилттай үүсгэгдлээ' })
  @ApiResponse({ status: 400, description: 'Тайлан үүсгэхэд алдаа гарлаа' })
  async generateReport(@Body() generateReportDto: GenerateReportDto) {
    return this.reportsService.generateReport(generateReportDto);
  }

  @Post('generate/quick')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.USER)
  @ApiOperation({ summary: 'Түргэн тайлан', description: 'Түргэн тайлан үүсгэх' })
  @ApiResponse({ status: 200, description: 'Түргэн тайлан амжилттай үүсгэгдлээ' })
  async generateQuickReport(@Body() filterDto: ReportFilterDto) {
    return this.reportsService.generateQuickReport(filterDto);
  }

  @Get('dashboard/summary')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Хяналтын самбарын тойм', description: 'Хяналтын самбарын тойм статистик авах' })
  @ApiResponse({ status: 200, description: 'Тойм статистик амжилттай авлаа' })
  async getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }

  @Get('organization/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Байгууллагын тайлан', description: 'Тодорхой байгууллагын тайлан авах' })
  @ApiResponse({ status: 200, description: 'Байгууллагын тайлан амжилттай авлаа' })
  async getOrganizationReports(
    @Param('organizationId') organizationId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getOrganizationReports(organizationId, startDate, endDate);
  }

  @Get('export/:id/:format')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Тайлан экспортлох', description: 'Тайланг экспортлох (PDF, Excel)' })
  @ApiResponse({ status: 200, description: 'Тайлан амжилттай экспортлогдлоо' })
  async exportReport(
    @Param('id') id: string,
    @Param('format') format: string,
  ) {
    return this.reportsService.exportReport(id, format);
  }
}