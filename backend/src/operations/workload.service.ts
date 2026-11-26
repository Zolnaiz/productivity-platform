/**
 * Workload (M12): loads one organisation's open tasks and active people, and asks workload.ts how loaded each
 * person is and what one more task would do. "Today" is the organisation's calendar day. Read-only.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { User } from '../users/entities/user.entity';
import { TaskStatus, WorkTask } from './entities/task.entity';
import { clockFrom } from './organization-clock';
import { todayIn } from './task-completion';
import { AssignmentPreview, PersonWorkload, previewAssignment, workloadByPerson } from './workload';

type CurrentUser = { id?: string; organizationId?: string };

export interface PreviewQuery {
  /** People to compare; every active member of the organisation when empty. */
  assigneeIds?: string[];
  dueDate?: string;
  estimatedHours?: number;
  /** The task being reassigned, left out of its current owner's load so it is not counted twice. */
  taskId?: string;
}

@Injectable()
export class WorkloadService {
  constructor(
    @InjectRepository(WorkTask) private readonly tasks: Repository<WorkTask>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Organization) private readonly organizations: Repository<Organization>,
  ) {}

  private organizationOf(user: CurrentUser) {
    if (!user?.organizationId) throw apiError(ErrorCode.AuthOrganizationRequired);
    return user.organizationId;
  }

  private async today(organizationId: string) {
    const organization = await this.organizations.findOne({ where: { id: organizationId } });
    return todayIn(clockFrom(organization?.settings).timeZone);
  }

  /** Only the committed statuses: the backlog and finished work never weigh on anybody. */
  private openTasks(organizationId: string) {
    return this.tasks.find({
      where: { organizationId, status: In([TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW]) },
      select: ['id', 'assigneeId', 'status', 'dueDate', 'estimatedHours', 'actualHours'],
    });
  }

  async team(user: CurrentUser): Promise<{ today: string; people: PersonWorkload[] }> {
    const organizationId = this.organizationOf(user);
    const [today, tasks] = await Promise.all([this.today(organizationId), this.openTasks(organizationId)]);
    return { today, people: workloadByPerson(tasks, today) };
  }

  async preview(query: PreviewQuery, user: CurrentUser): Promise<{ today: string; candidates: AssignmentPreview[] }> {
    const organizationId = this.organizationOf(user);
    const [today, allTasks, members] = await Promise.all([
      this.today(organizationId),
      this.openTasks(organizationId),
      this.users.find({ where: { organizationId, isActive: true }, select: ['id'] }),
    ]);
    // Only people of this organisation can be compared, whatever ids were asked for.
    const memberIds = new Set(members.map((member) => member.id));
    const candidates = query.assigneeIds?.length
      ? query.assigneeIds.filter((id) => memberIds.has(id))
      : [...memberIds];
    const tasks = query.taskId ? allTasks.filter((task) => task.id !== query.taskId) : allTasks;
    return {
      today,
      candidates: previewAssignment(
        tasks,
        candidates,
        { dueDate: query.dueDate, estimatedHours: query.estimatedHours, status: 'todo' },
        today,
      ),
    };
  }
}
