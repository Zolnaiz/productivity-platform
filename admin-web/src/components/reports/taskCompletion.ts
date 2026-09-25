/**
 * When a task was finished, and which month that puts it in.
 *
 * The server's rule (`backend/src/operations/task-completion.ts`), stated
 * again for the demo, which keeps its records in the browser. The tests on
 * each side pin the same cases.
 */

interface CompletableTask {
  status?: string;
  completedAt?: string | null;
  dueDate?: string | null;
  createdAt?: string | null;
}

const monthOf = (value?: string | null) => (value ? String(value).slice(0, 7) : undefined);

/** The month a task was planned for: when it is due, or when it was raised. */
export const plannedMonth = (task: CompletableTask) => monthOf(task.dueDate || task.createdAt);

/**
 * The month a task was finished in, or nothing if it is not finished. A task
 * finished before dates were kept goes by its plan, as it always did.
 */
export const completionMonth = (task: CompletableTask) => {
  if (task.status !== 'done') return undefined;

  return task.completedAt ? monthOf(task.completedAt) : plannedMonth(task);
};

/** Whether a task was finished by the end of `month`. */
export const doneByEndOf = (task: CompletableTask, month: string) => {
  const finished = completionMonth(task);

  return Boolean(finished && finished <= month);
};

/**
 * The completion date a save should leave behind: stamped on the move to
 * done, kept on an unrelated edit, cleared on reopening. Never the caller's.
 */
export const completionAfter = (
  statusBefore: string | undefined,
  after: CompletableTask,
  now = new Date(),
): string | null | undefined => {
  if (after.status !== 'done') return null;
  if (statusBefore !== 'done') return now.toISOString();

  return after.completedAt;
};
