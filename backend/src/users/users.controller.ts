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
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Managing the people already in an organization.
 *
 * There is deliberately no create endpoint: an invitation is the only way into
 * an organization, so that joining always proves an invitation was issued for
 * that address. This controller lists, reads, edits, deactivates and changes
 * the role of members who are already there.
 *
 * The routes name permissions rather than roles, from the same table the
 * operations API and the client both read. Naming roles here meant a second
 * list, and it had already drifted: it admitted only `super_admin` and
 * `organization_admin`, so the seeded workspace owner — an `admin` — could not
 * see their own team.
 *
 * Two routes are deliberately open to every signed-in member: reading and
 * editing your own profile. The `:id` routes are the administrative ones;
 * `profile/me` is how somebody edits themselves.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission('users:read')
  @ApiOperation({ summary: 'List the members of the organization' })
  findAll(@Request() req, @Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query, req.user.organizationId, req.user.role);
  }

  @Get('profile/me')
  @ApiOperation({ summary: 'Read your own profile' })
  getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile/me')
  @ApiOperation({ summary: 'Edit your own profile' })
  updateProfile(@Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Get('profile/permissions')
  @ApiOperation({ summary: 'What you are allowed to do' })
  getOwnPermissions(@Request() req) {
    // The client asks this to decide which controls to draw. It reads the same
    // table the server enforces with, so what it draws is what will be
    // allowed.
    return this.usersService.getPermissions(req.user.id, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Read a member' })
  findOne(@Param('id') id: string, @Request() req) {
    // No permission named: the service admits an administrator of the same
    // organization, or the person themselves, and refuses everybody else.
    return this.usersService.findOne(id, req.user);
  }

  @Patch(':id')
  @RequirePermission('users:update')
  @ApiOperation({ summary: 'Edit a member' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @RequirePermission('users:delete')
  @ApiOperation({ summary: 'Remove a member' })
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user);
  }

  @Post(':id/activate')
  @RequirePermission('users:update')
  @ApiOperation({ summary: 'Bring a removed member back' })
  activate(@Param('id') id: string, @Request() req) {
    return this.usersService.activate(id, req.user);
  }

  @Post(':id/deactivate')
  @RequirePermission('users:update')
  @ApiOperation({ summary: 'Deactivate a member' })
  deactivate(@Param('id') id: string, @Request() req) {
    return this.usersService.deactivate(id, req.user);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'What a member is allowed to do' })
  getPermissions(@Param('id') id: string, @Request() req) {
    return this.usersService.getPermissions(id, req.user);
  }

  @Post(':id/change-role')
  @RequirePermission('users:update')
  @ApiOperation({ summary: 'Move a member to another role' })
  changeRole(@Param('id') id: string, @Body() body: ChangeRoleDto, @Request() req) {
    // The permission gets you to the route; the role hierarchy in the service
    // decides whether this particular change is one you may make.
    return this.usersService.changeRole(id, body.role, req.user);
  }
}
