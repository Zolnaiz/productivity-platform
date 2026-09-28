import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { CreateIdeaDto, ReviewIdeaDto } from './dto/ideas.dto';
import { Idea, IdeaStatus } from './entities/idea.entity';
import { TaskSource, TaskStatus } from './entities/task.entity';
import { NotificationsService } from './notifications.service';
import { OperationsService } from './operations.service';

type CurrentUser = { id?: string; role?: string; organizationId?: string };

/** The words the author is told in, by what became of their idea. */
const REVIEWED_KEY: Record<string, string> = {
  [IdeaStatus.APPROVED]: 'raised.ideaApproved',
  [IdeaStatus.DECLINED]: 'raised.ideaDeclined',
  [IdeaStatus.DONE]: 'raised.ideaDone',
};

const REVIEWED_ENGLISH: Record<string, (title: string) => string> = {
  [IdeaStatus.APPROVED]: (title) => `Your idea was taken up: ${title}`,
  [IdeaStatus.DECLINED]: (title) => `Your idea was not taken up: ${title}`,
  [IdeaStatus.DONE]: (title) => `Your idea is in place: ${title}`,
};

/**
 * The idea box: anybody puts an idea in, somebody who runs the work decides,
 * and an idea taken up becomes a task for whoever is to put it in place -
 * the person who had it, unless the reviewer says otherwise. The author is
 * told each decision, so an idea is never simply lost.
 */
@Injectable()
export class IdeasService {
  constructor(
    @InjectRepository(Idea) private readonly ideas: Repository<Idea>,
    private readonly operations: OperationsService,
    private readonly notifications: NotificationsService,
  ) {}

  private organizationOf(user: CurrentUser) {
    if (!user?.organizationId) throw apiError(ErrorCode.AuthOrganizationRequired);
    return user.organizationId;
  }

  /** Everybody's ideas, newest first: seeing what others suggested is half of why people suggest. */
  findAll(user: CurrentUser) {
    return this.ideas.find({
      where: { organizationId: this.organizationOf(user) },
      order: { createdAt: 'DESC' },
      take: 500,
    });
  }

  create(payload: CreateIdeaDto, user: CurrentUser) {
    const idea = this.ideas.create({
      organizationId: this.organizationOf(user),
      authorId: user.id,
      title: payload.title.trim(),
      description: payload.description?.trim() ?? '',
      area: payload.area?.trim() ?? '',
      benefit: payload.benefit?.trim() ?? '',
      status: IdeaStatus.SUBMITTED,
      reviewNote: '',
    });
    return this.ideas.save(idea);
  }

  async review(id: string, decision: ReviewIdeaDto, user: CurrentUser) {
    const idea = await this.ideas.findOne({ where: { id, organizationId: this.organizationOf(user) } });
    if (!idea) throw apiError(ErrorCode.ResourceNotFound, 'Idea');

    idea.status = decision.status;
    idea.reviewerId = user.id;
    idea.reviewedAt = new Date();
    if (decision.note !== undefined) idea.reviewNote = decision.note.trim();

    // Taken up: the work it calls for, raised once however often it is approved.
    if (decision.status === IdeaStatus.APPROVED && !idea.taskId) {
      const task = await this.operations.createTask(
        {
          title: idea.title,
          // The author's own words, where, and what it would bring.
          description: [idea.description, idea.area, idea.benefit].filter(Boolean).join('\n\n'),
          assigneeId: decision.assigneeId || idea.authorId,
          dueDate: decision.dueDate,
          status: TaskStatus.TODO,
          priority: 'medium',
          sourceType: TaskSource.IDEA,
          sourceId: idea.id,
        },
        user,
      );
      idea.taskId = task.id;
    }

    const saved = await this.ideas.save(idea);

    // The author hears what became of it - not the reviewer telling themself.
    if (idea.authorId && idea.authorId !== user.id) {
      await this.notifications.notify({
        userId: idea.authorId,
        organizationId: idea.organizationId,
        title: REVIEWED_ENGLISH[decision.status](idea.title),
        titleKey: REVIEWED_KEY[decision.status],
        titleParams: { title: idea.title },
        body: idea.reviewNote,
        link: '/ideas',
        sourceType: `idea_${decision.status}`,
        sourceId: idea.id,
      });
    }

    return saved;
  }
}
