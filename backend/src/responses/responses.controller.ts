import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../shared/constants';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('responses')
@Controller('responses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Submit a response' })
  @ApiResponse({ status: 201, description: 'Response submitted successfully' })
  create(@Body() createResponseDto: CreateResponseDto, @Request() req) {
    return this.responsesService.create(createResponseDto, req.user);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all responses' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('questionnaireId') questionnaireId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req,
  ) {
    return this.responsesService.findAll(
      {
        page,
        limit,
        questionnaireId,
        organizationId,
        userId,
        startDate,
        endDate,
      },
      req.user,
    );
  }

  @Get('questionnaire/:questionnaireId')
  @ApiOperation({ summary: 'Get responses by questionnaire' })
  findByQuestionnaire(
    @Param('questionnaireId') questionnaireId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req,
  ) {
    return this.responsesService.findByQuestionnaire(
      questionnaireId,
      { page, limit },
      req.user,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get responses by user' })
  findByUser(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req,
  ) {
    return this.responsesService.findByUser(userId, { page, limit }, req.user);
  }

  @Get('my-responses')
  @ApiOperation({ summary: 'Get current user responses' })
  findMyResponses(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req,
  ) {
    return this.responsesService.findMyResponses({ page, limit }, req.user);
  }

  @Get('questionnaire/:questionnaireId/export')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Export questionnaire responses' })
  exportResponses(
    @Param('questionnaireId') questionnaireId: string,
    @Query('format') format: 'csv' | 'excel' | 'json' = 'json',
    @Request() req,
  ) {
    return this.responsesService.exportResponses(questionnaireId, format, req.user);
  }

  @Get('questionnaire/:questionnaireId/summary')
  @ApiOperation({ summary: 'Get questionnaire response summary' })
  getQuestionnaireSummary(
    @Param('questionnaireId') questionnaireId: string,
    @Request() req,
  ) {
    return this.responsesService.getQuestionnaireSummary(questionnaireId, req.user);
  }

  @Post('questionnaire/:questionnaireId/bulk-delete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Bulk delete responses' })
  bulkDelete(
    @Param('questionnaireId') questionnaireId: string,
    @Body('responseIds') responseIds: string[],
    @Request() req,
  ) {
    return this.responsesService.bulkDelete(questionnaireId, responseIds, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get response by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.responsesService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Update response' })
  update(
    @Param('id') id: string,
    @Body() updateResponseDto: UpdateResponseDto,
    @Request() req,
  ) {
    return this.responsesService.update(id, updateResponseDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Delete response' })
  remove(@Param('id') id: string, @Request() req) {
    return this.responsesService.remove(id, req.user);
  }

  @Get(':id/analysis')
  @ApiOperation({ summary: 'Get response analysis' })
  getAnalysis(@Param('id') id: string, @Request() req) {
    return this.responsesService.getAnalysis(id, req.user);
  }

}
