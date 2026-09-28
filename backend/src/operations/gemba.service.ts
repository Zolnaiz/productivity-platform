import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { mondayOf } from './checkins.service';
import { CreateGembaWalkDto } from './dto/gemba.dto';
import { GembaWalk } from './entities/gemba-walk.entity';
import { TaskSource, TaskStatus } from './entities/task.entity';
import { OperationsService } from './operations.service';
import { todayIn } from './task-completion';
import { clockFrom } from './organization-clock';

type CurrentUser = { id?: string; role?: string; organizationId?: string };

/** Who is expected to walk: whoever runs other people's work. */
const WALKER_ROLES = ['manager', 'admin', 'organization_admin', 'super_admin'];

/** Walks a manager is asked for each week, unless the organization says otherwise. */
export const DEFAULT_WALKS_PER_WEEK = 1;

const addDays = (day: string, days: number) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date + days)).toISOString().slice(0, 10);
};

/**
 * Gemba walks and how each manager is keeping to them.
 *
 * A walk is recorded with its follow-ups, and each follow-up becomes a task
 * at once - for the walker unless they name somebody - so what was seen on
 * the floor does not stay in a notebook. The week's view says, for every
 * manager, how many walks they made against the organization's target.
 */
@Injectable()
export class GembaService {
  constructor(
    @InjectRepository(GembaWalk) private readonly walks: Repository<GembaWalk>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Organization) private readonly organizations: Repository<Organization>,
    private readonly operations: OperationsService,
  ) {}

  private who(user: CurrentUser) {
    if (!user?.organizationId || !user.id) throw apiError(ErrorCode.AuthOrganizationRequired);
    return { organizationId: user.organizationId, walkerId: user.id };
  }

  private async organization(organizationId: string) {
    return this.organizations.findOne({ where: { id: organizationId } });
  }

  async record(payload: CreateGembaWalkDto, user: CurrentUser) {
    const { organizationId, walkerId } = this.who(user);
    const organization = await this.organization(organizationId);
    const walkedOn = payload.walkedOn ?? todayIn(clockFrom(organization?.settings).timeZone);

    const followUps: GembaWalk['followUps'] = [];
    for (const followUp of payload.followUps ?? []) {
      const title = followUp.title.trim();
      if (!title) continue;
      const assigneeId = followUp.assigneeId || walkerId;
      const task = await this.operations.createTask(
        {
          title,
          description: [payload.area?.trim(), payload.observations?.trim()].filter(Boolean).join('\n\n'),
          assigneeId,
          status: TaskStatus.TODO,
          priority: 'medium',
          sourceType: TaskSource.GEMBA,
          sourceId: `${walkerId}:${walkedOn}:${title}`,
        },
        user,
      );
      followUps.push({ title, taskId: task.id, assigneeId });
    }

    const walk = this.walks.create({
      organizationId,
      walkerId,
      walkedOn,
      zoneId: payload.zoneId,
      area: payload.area?.trim() ?? '',
      observations: payload.observations?.trim() ?? '',
      conversations: payload.conversations?.trim() ?? '',
      followUps,
    });
    return this.walks.save(walk);
  }

  /** The week a day falls in: every walk, and each manager's count against the target. */
  async week(day: string, user: CurrentUser) {
    const { organizationId } = this.who(user);
    const monday = mondayOf(day);
    const sunday = addDays(monday, 6);
    const [walks, walkers, organization] = await Promise.all([
      this.walks.find({
        where: { organizationId, walkedOn: Between(monday, sunday) },
        order: { walkedOn: 'DESC', createdAt: 'DESC' },
      }),
      this.users.find({ where: { organizationId, role: In(WALKER_ROLES) as never, isActive: true } }),
      this.organization(organizationId),
    ]);
    const target = Number(organization?.settings?.gembaWalksPerWeek) || DEFAULT_WALKS_PER_WEEK;

    return {
      week: monday,
      target,
      walks,
      walkers: walkers
        .map((walker) => ({
          userId: walker.id,
          walks: walks.filter((walk) => walk.walkerId === walker.id).length,
        }))
        .sort((a, b) => a.walks - b.walks),
    };
  }
}
