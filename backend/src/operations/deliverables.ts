/**
 * Work documents and their review (PLAN_V2 M2, idea 8): who may add a file to a task, send it for review, and
 * approve or return it, depending on where the review stands.
 *
 * A task's documents (a report, a drawing, photographs of physical work) are attachments owned by the task
 * (attachments, owner `work_task`, kind `deliverable`). Every upload is kept: a second upload is version 2,
 * not a replacement. The review is four states on the task itself:
 *
 *   none ─ submit ─► submitted ─ approve ─► approved   (locked: no file added or removed afterwards)
 *                        │
 *                        └─ return (with a reason) ─► returned ─ submit ─► submitted …
 *
 * While submitted the files are frozen too, so the reviewer approves exactly what they downloaded. Pure
 * functions; DeliverablesService loads the task and calls them, and the spec states the rules as cases.
 */

export type ReviewStatus = 'none' | 'submitted' | 'approved' | 'returned';

/** The shortest reason a document can be returned with: "no" is not a reason the author can act on. */
export const MIN_RETURN_NOTE = 3;

export interface ReviewActor {
  id: string;
  /** May approve and return (deliverables:review). */
  canReview: boolean;
  /** May manage any task's files, not just their own (tasks:create, i.e. managers and up). */
  canManageTasks: boolean;
}

export interface ReviewedTask {
  assigneeId?: string | null;
  reporterId?: string | null;
  reviewStatus?: string | null;
}

export type ReviewRefusal =
  | 'not_yours' // only the assignee or a manager may change a task's documents
  | 'locked' // under review or approved: files cannot change
  | 'no_files' // nothing to review
  | 'wrong_state' // e.g. approving what was not submitted
  | 'self_review' // nobody approves their own work
  | 'note_required'; // a return needs a reason

export const statusOf = (task: ReviewedTask): ReviewStatus =>
  task.reviewStatus === 'submitted' || task.reviewStatus === 'approved' || task.reviewStatus === 'returned'
    ? task.reviewStatus
    : 'none';

const mayHandle = (task: ReviewedTask, actor: ReviewActor) => actor.canManageTasks || task.assigneeId === actor.id;

/** Adding or deleting a file. */
export const fileChangeRefusal = (task: ReviewedTask, actor: ReviewActor): ReviewRefusal | null => {
  if (!mayHandle(task, actor)) return 'not_yours';
  const status = statusOf(task);
  if (status === 'submitted' || status === 'approved') return 'locked';
  return null;
};

export const submitRefusal = (task: ReviewedTask, actor: ReviewActor, fileCount: number): ReviewRefusal | null => {
  if (!mayHandle(task, actor)) return 'not_yours';
  const status = statusOf(task);
  if (status === 'submitted' || status === 'approved') return 'wrong_state';
  if (fileCount < 1) return 'no_files';
  return null;
};

export const approveRefusal = (task: ReviewedTask, actor: ReviewActor): ReviewRefusal | null => {
  if (!actor.canReview) return 'not_yours';
  if (statusOf(task) !== 'submitted') return 'wrong_state';
  if (task.assigneeId === actor.id) return 'self_review';
  return null;
};

export const returnRefusal = (task: ReviewedTask, actor: ReviewActor, note?: string | null): ReviewRefusal | null => {
  const refusal = approveRefusal(task, actor);
  if (refusal) return refusal;
  if ((note ?? '').trim().length < MIN_RETURN_NOTE) return 'note_required';
  return null;
};

/**
 * Who is told that documents are waiting: the person who gave out the task, unless that is the author; nobody
 * otherwise (the reviewers' list on the web shows every submitted task to whoever may review).
 */
export const reviewerToTell = (task: ReviewedTask, submitterId: string): string | null =>
  task.reporterId && task.reporterId !== submitterId && task.reporterId !== task.assigneeId ? task.reporterId : null;

/** Version numbers by upload order, oldest = 1; files are listed newest first. */
export const numberVersions = <T extends { createdAt: Date | string }>(files: T[]): Array<T & { version: number }> =>
  [...files]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((file, index) => ({ ...file, version: index + 1 }))
    .reverse();
