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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../shared/constants';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created successfully' })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all organizations' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.organizationsService.findAll({
      page,
      limit,
      search,
      isActive,
    });
  }

  @Get('my-organization')
  @ApiOperation({ summary: 'Get current user organization' })
  getMyOrganization(@Request() req) {
    return this.organizationsService.getMyOrganization(req.user.organizationId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update organization' })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete organization' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }

  @Post(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Activate organization' })
  activate(@Param('id') id: string) {
    return this.organizationsService.activate(id);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate organization' })
  deactivate(@Param('id') id: string) {
    return this.organizationsService.deactivate(id);
  }

  @Get(':id/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get organization users' })
  getUsers(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Request() req,
  ) {
    return this.organizationsService.getUsers(
      id,
      { page, limit, search, role },
      req.user,
    );
  }

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get organization statistics' })
  getStats(@Param('id') id: string, @Request() req) {
    return this.organizationsService.getStats(id, req.user);
  }

  @Post(':id/invite-user')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Invite user to organization' })
  inviteUser(
    @Param('id') id: string,
    @Body('email') email: string,
    @Body('role') role: UserRole,
    @Request() req,
  ) {
    return this.organizationsService.inviteUser(id, email, role, req.user);
  }

  @Post(':id/remove-user/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Remove user from organization' })
  removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    return this.organizationsService.removeUser(id, userId, req.user);
  }
}