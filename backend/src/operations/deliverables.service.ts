/**
 * Work documents of a task and their review (PLAN_V2 M2). Loads the task within the caller's organisation, asks
 * deliverables.ts whether the step is allowed, stores files through AttachmentsService (owner `work_task`,
 * kind `deliverable`), and tells the other side: the reviewer when documents arrive, the author when they are
 * approved or returned. Approval also finishes the task, through OperationsService, so completion is stamped
 * the same way as any other finished task (K1).
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { hasPermission } from '../shared/roles';
import { AttachmentsService, UploadedAttachment } from './attachments.service';
import { AttachmentKind, AttachmentOwner } from './entities/attachment.entity';
import { TaskStatus, WorkTask } from './entities/task.entity';
import {
  approveRefusal,
  fileChangeRefusal,
  numberVersions,
  ReviewActor,
  ReviewRefusal,
  returnRefusal,
  reviewerToTell,
  statusOf,
  submitRefusal,
} from './deliverables';
import { NotificationsService } from './notifications.service';
import { OperationsService } from './operations.service';

type CurrentUser = { id?: string; organizationId?: string; role?: string };

/** Each refusal as the error the clients already translate. */
const refuse = (refusal: ReviewRefusal): never => {
  switch (refusal) {
    case 'not_yours':
      throw apiError(ErrorCode.AccessDenied);
    case 'locked':
      throw apiError(ErrorCode.DeliverableLocked);
    case 'no_files':
      throw apiError(ErrorCode.DeliverableNoFiles);
    case 'self_review':
      throw apiError(ErrorCode.SelfReview);
    case 'note_required':
      throw apiError(ErrorCode.ValidationFailed, 'note');
    default:
      throw apiError(ErrorCode.DeliverableState);
  }
};

@Injectable()
export class DeliverablesService {
  constructor(
    @InjectRepository(WorkTask) private readonly tasks: Repository<WorkTask>,
    private readonly attachments: AttachmentsService,
    private readonly notifications: NotificationsService,
    private readonly operations: OperationsService,
  ) {}

  private actor(user: CurrentUser): ReviewActor {
    if (!user?.id || !user.organizationId) throw apiError(ErrorCode.AuthOrganizationRequired);
    return {
      id: user.id,
      canReview: hasPermission(user.role, 'deliverables:review'),
      canManageTasks: hasPermission(user.role, 'tasks:create'),
    };
  }

  private async task(taskId: string, user: CurrentUser) {
    const task = await this.tasks.findOne({ where: { id: taskId, organizationId: user.organizationId } });
    if (!task) throw apiError(ErrorCode.ResourceNotFound, 'Task');
    return task;
  }

  private files(taskId: string, user: CurrentUser) {
    return this.attachments.findForOwner(AttachmentOwner.WORK_TASK, taskId, user);
  }

  /** The review as the clients show it, and the files newest first with their version numbers. */
  private async view(task: WorkTask, user: CurrentUser) {
    return {
      review: {
        status: statusOf(task),
        note: task.reviewNote ?? null,
        reviewedBy: task.reviewedBy ?? null,
        reviewedAt: task.reviewedAt ?? null,
        submittedAt: task.submittedAt ?? null,
      },
      files: numberVersions(await this.files(task.id, user)),
    };
  }

  async list(taskId: string, user: CurrentUser) {
    this.actor(user);
    return this.view(await this.task(taskId, user), user);
  }

  async upload(taskId: string, file: UploadedAttachment | undefined, caption: string | undefined, user: CurrentUser) {
    const actor = this.actor(user);
    const task = await this.task(taskId, user);
    const refusal = fileChangeRefusal(task, actor);
    if (refusal) refuse(refusal);
    await this.attachments.upload(
      file,
      { ownerType: AttachmentOwner.WORK_TASK, ownerId: task.id, kind: AttachmentKind.DELIVERABLE },
      caption,
      user,
    );
    return this.view(task, user);
  }

  async removeFile(taskId: string, attachmentId: string, user: CurrentUser) {
    const actor = this.actor(user);
    const task = await this.task(taskId, user);
    const refusal = fileChangeRefusal(task, actor);
    if (refusal) refuse(refusal);
    const file = (await this.files(task.id, user)).find((candidate) => candidate.id === attachmentId);
    if (!file) throw apiError(ErrorCode.ResourceNotFound, 'Attachment');
    await this.attachments.remove(file.id, user, { allowWorkTask: true });
    return this.view(task, user);
  }

  async submit(taskId: string, user: CurrentUser) {
    const actor = this.actor(user);
    const task = await this.task(taskId, user);
    const refusal = submitRefusal(task, actor, (await this.files(task.id, user)).length);
    if (refusal) refuse(refusal);

    task.reviewStatus = 'submitted';
    task.submittedAt = new Date();
    const saved = await this.tasks.save(task);
    const reviewer = reviewerToTell(saved, actor.id);
    if (reviewer) await this.tell(reviewer, saved, 'raised.deliverableSubmitted', `Documents to review: ${saved.title}`);
    return this.view(saved, user);
  }

  async approve(taskId: string, user: CurrentUser) {
    const actor = this.actor(user);
    const task = await this.task(taskId, user);
    const refusal = approveRefusal(task, actor);
    if (refusal) refuse(refusal);

    task.reviewStatus = 'approved';
    task.reviewNote = null;
    task.reviewedBy = actor.id;
    task.reviewedAt = new Date();
    await this.tasks.save(task);
    // Approved work is finished work: through the ordinary update, so completion is dated as for any task.
    const finished =
      task.status === TaskStatus.DONE
        ? task
        : await this.operations.updateTask(task.id, { status: TaskStatus.DONE }, user);
    if (task.assigneeId) {
      await this.tell(task.assigneeId, task, 'raised.deliverableApproved', `Your documents were approved: ${task.title}`);
    }
    return this.view({ ...task, status: finished.status } as WorkTask, user);
  }

  async returnForChanges(taskId: string, note: string | undefined, user: CurrentUser) {
    const actor = this.actor(user);
    const task = await this.task(taskId, user);
    const refusal = returnRefusal(task, actor, note);
    if (refusal) refuse(refusal);

    task.reviewStatus = 'returned';
    task.reviewNote = (note ?? '').trim().slice(0, 2000);
    task.reviewedBy = actor.id;
    task.reviewedAt = new Date();
    const saved = await this.tasks.save(task);
    if (saved.assigneeId) {
      await this.tell(
        saved.assigneeId,
        saved,
        'raised.deliverableReturned',
        `Your documents were returned: ${saved.title}`,
        saved.reviewNote ?? '',
      );
    }
    return this.view(saved, user);
  }

  /**
   * One notification per event. The source id carries the moment, because the inbox keeps one notification per
   * source and a second round of review is a new thing to be told. A failed delivery never undoes the review.
   */
  private async tell(userId: string, task: WorkTask, titleKey: string, title: string, body = '') {
    try {
      await this.notifications.notify({
        userId,
        organizationId: task.organizationId,
        title,
        titleKey,
        titleParams: { title: task.title },
        body,
        link: '/tasks',
        sourceType: 'work_task_review',
        sourceId: `${task.id}:${titleKey}:${Date.now()}`,
      });
    } catch {
      // The review stands; see above.
    }
  }
}
