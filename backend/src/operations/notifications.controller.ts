import { Controller, Get, Param, Patch, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { RequirePermission } from '../shared/decorators/permissions.decorator';

/**
 * Somebody's own inbox.
 *
 * Every route here is about the person asking and nobody else, which is why
 * none of them takes a user id: an inbox that can be addressed by identifier
 * is an inbox somebody else can read.
 */
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermission('notifications:read')
  findMine(@Request() req, @Query('limit') limit?: string) {
    return this.notifications.findMine(req.user, limit ? Number(limit) : undefined);
  }

  @Get('unread-count')
  @RequirePermission('notifications:read')
  async unreadCount(@Request() req) {
    return { unread: await this.notifications.countUnread(req.user) };
  }

  @Patch('read-all')
  @RequirePermission('notifications:update')
  markAllRead(@Request() req) {
    return this.notifications.markAllRead(req.user);
  }

  @Patch(':id/read')
  @RequirePermission('notifications:update')
  markRead(@Param('id') id: string, @Request() req) {
    return this.notifications.markRead(id, req.user);
  }
}
