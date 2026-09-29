import { Controller, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { User } from '../users/entities/user.entity';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { NotificationsService } from './notifications.service';

/** Who may delete somebody's account: the organization's administrators. */
const DELETERS = ['admin', 'organization_admin', 'super_admin'];

/**
 * Asking for one's own account to be deleted.
 *
 * An account belongs to an organization, and its records - the tasks, the
 * audits, the month's reports - are the organization's; so the request goes
 * to its administrators, who delete the account and decide what of its
 * records must be kept. Google Play asks every app with accounts for a way to
 * ask from inside the app; this is it.
 */
@ApiTags('account')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller('account')
export class AccountController {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  @Post('deletion-request')
  @HttpCode(200)
  @RequirePermission('account:request-deletion')
  @ApiOperation({ summary: 'Ask the organization’s administrators to delete my account' })
  async requestDeletion(@Request() req) {
    const user = req.user as { id?: string; organizationId?: string };
    if (!user?.id || !user.organizationId) throw apiError(ErrorCode.AuthOrganizationRequired);

    const [me, administrators] = await Promise.all([
      this.users.findOne({ where: { id: user.id } }),
      this.users.find({ where: { organizationId: user.organizationId, role: In(DELETERS) as never, isActive: true } }),
    ]);
    const name = [me?.firstName, me?.lastName].filter(Boolean).join(' ') || me?.email || user.id;

    let told = 0;
    for (const administrator of administrators) {
      if (administrator.id === user.id) continue;
      const sent = await this.notifications.notify({
        userId: administrator.id,
        organizationId: user.organizationId,
        title: `Account deletion requested: ${name}`,
        titleKey: 'raised.deletionRequested',
        titleParams: { name },
        link: '/users',
        // Asked twice, told once.
        sourceType: 'account_deletion',
        sourceId: user.id,
      });
      if (sent) told += 1;
    }

    return { requested: true, administratorsTold: told };
  }
}
