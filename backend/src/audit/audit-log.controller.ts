import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { ListAuditLogQueryDto } from './dto/list-audit-log-query.dto';

interface AuthenticatedRequest {
  user?: { id?: string; organizationId?: string; role?: string };
}

/**
 * Reading the record of who changed what.
 *
 * Read-only on purpose: there is no route that writes, edits or removes an
 * entry. Entries are written by `AuditLogInterceptor` from requests the server
 * observed, which is the only way the record means anything.
 */
@ApiTags('audit-log')
@ApiBearerAuth()
@Controller('audit-log')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogController {
  constructor(private readonly auditLog: AuditLogService) {}

  @Get()
  @RequirePermission('auditlog:read')
  @ApiOperation({ summary: 'What has been changed in this organization' })
  findAll(@Request() request: AuthenticatedRequest, @Query() query: ListAuditLogQueryDto) {
    return this.auditLog.findForOrganization(request.user?.organizationId, query.limit);
  }
}
