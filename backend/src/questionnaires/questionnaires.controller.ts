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
import { QuestionnairesService } from './questionnaires.service';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../shared/constants';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('questionnaires')
@Controller('questionnaires')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuestionnairesController {
  constructor(private readonly questionnairesService: QuestionnairesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Create a new questionnaire' })
  @ApiResponse({ status: 201, description: 'Questionnaire created successfully' })
  create(@Body() createQuestionnaireDto: CreateQuestionnaireDto, @Request() req) {
    return this.questionnairesService.create(createQuestionnaireDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all questionnaires' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('organizationId') organizationId?: string,
    @Query('isActive') isActive?: boolean,
    @Query('expired') expired?: boolean,
    @Request() req,
  ) {
    return this.questionnairesService.findAll(
      {
        page,
        limit,
        search,
        organizationId,
        isActive,
        expired,
      },
      req.user,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get questionnaire by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.questionnairesService.findOne(id, req.user);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Get questionnaires by organization' })
  findByOrganization(
    @Param('organizationId') organizationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('isActive') isActive?: boolean,
    @Request() req,
  ) {
    return this.questionnairesService.findByOrganization(
      organizationId,
      { page, limit, isActive },
      req.user,
    );
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Update questionnaire' })
  update(
    @Param('id') id: string,
    @Body() updateQuestionnaireDto: UpdateQuestionnaireDto,
    @Request() req,
  ) {
    return this.questionnairesService.update(id, updateQuestionnaireDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Delete questionnaire' })
  remove(@Param('id') id: string, @Request() req) {
    return this.questionnairesService.remove(id, req.user);
  }

  @Post(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Activate questionnaire' })
  activate(@Param('id') id: string, @Request() req) {
    return this.questionnairesService.activate(id, req.user);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Deactivate questionnaire' })
  deactivate(@Param('id') id: string, @Request() req) {
    return this.questionnairesService.deactivate(id, req.user);
  }

  @Get(':id/responses')
  @ApiOperation({ summary: 'Get questionnaire responses' })
  getResponses(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Request() req,
  ) {
    return this.questionnairesService.getResponses(id, { page, limit }, req.user);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get questionnaire analytics' })
  getAnalytics(@Param('id') id: string, @Request() req) {
    return this.questionnairesService.getAnalytics(id, req.user);
  }

  @Get(':id/share-link')
  @ApiOperation({ summary: 'Get questionnaire share link' })
  getShareLink(@Param('id') id: string, @Request() req) {
    return this.questionnairesService.getShareLink(id, req.user);
  }

  @Post(':id/duplicate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Duplicate questionnaire' })
  duplicate(@Param('id') id: string, @Request() req) {
    return this.questionnairesService.duplicate(id, req.user);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get questionnaire questions' })
  getQuestions(@Param('id') id: string, @Request() req) {
    return this.questionnairesService.getQuestions(id, req.user);
  }
}