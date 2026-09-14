import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { RequirePermission } from '../shared/decorators/permissions.decorator';

interface AuthenticatedRequest {
  user?: { id?: string; organizationId?: string; role?: string };
}

/**
 * The caller's own organization.
 *
 * There is no `:id` anywhere in this controller and no listing. The
 * organization is taken from the caller's token, so there is no path to
 * another tenant's record to guard in the first place — which is a better
 * defence than a check that has to be remembered on every route.
 *
 * What this replaced had cross-organization CRUD, a second way to add a
 * member that bypassed invitations, and a stats endpoint querying tables this
 * system does not have. None of it was reachable, because the module was
 * never registered. See `organizations.service.ts` for what went and why.
 */
@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get('my-organization')
  @ApiOperation({ summary: 'The organization you belong to' })
  getMyOrganization(@Request() request: AuthenticatedRequest) {
    // No permission named: every member needs their own workspace's name,
    // contact details and settings to use the application at all.
    return this.organizations.getMyOrganization(request.user?.organizationId);
  }

  @Patch('my-organization')
  @RequirePermission('organization:update')
  @ApiOperation({ summary: 'Edit the organization you belong to' })
  updateMyOrganization(@Body() changes: UpdateOrganizationDto, @Request() request: AuthenticatedRequest) {
    return this.organizations.updateMyOrganization(request.user?.organizationId, changes);
  }
}
