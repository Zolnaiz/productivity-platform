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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { UserRole } from '../shared/constants';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create(createUserDto, req.user.organizationId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Request() req,
  ) {
    return this.usersService.findAll(
      {
        page,
        limit,
        search,
        role,
      },
      req.user.organizationId,
      req.user.role,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.usersService.findOne(id, req.user);
  }

  @Get('profile/me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Patch('profile/me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Delete user' })
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user);
  }

  @Post(':id/activate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Activate user' })
  activate(@Param('id') id: string, @Request() req) {
    return this.usersService.activate(id, req.user);
  }

  @Post(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Deactivate user' })
  deactivate(@Param('id') id: string, @Request() req) {
    return this.usersService.deactivate(id, req.user);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get user permissions' })
  getPermissions(@Param('id') id: string, @Request() req) {
    return this.usersService.getPermissions(id, req.user);
  }

  @Post(':id/change-role')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN)
  @ApiOperation({ summary: 'Change user role' })
  changeRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
    @Request() req,
  ) {
    return this.usersService.changeRole(id, role, req.user);
  }
}