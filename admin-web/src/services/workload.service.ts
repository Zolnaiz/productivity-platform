/**
 * API client for workload (M12): GET /workload/preview, what giving one more task would do to each candidate.
 * In the demo workspace the same answer is worked out from the demo tasks by components/workload/workload.ts.
 */
import { get, isDemoMode } from './api';
import { operationsService } from './operations.service';
import { localDay } from '../components/progress/progressBoard';
import { AssignmentPreview, previewAssignment } from '../components/workload/workload';

export interface PreviewRequest {
  assigneeIds: string[];
  dueDate?: string;
  estimatedHours?: number;
  /** The task being reassigned, so its own hours are not counted against its current owner. */
  taskId?: string;
}

export const workloadService = {
  preview: async (request: PreviewRequest): Promise<AssignmentPreview[]> => {
    if (isDemoMode()) {
      const tasks = (await operationsService.getTasks()).filter((task) => task.id !== request.taskId);
      return previewAssignment(
        tasks,
        request.assigneeIds,
        { dueDate: request.dueDate, estimatedHours: request.estimatedHours, status: 'todo' },
        localDay(new Date()),
      );
    }
    const query = new URLSearchParams();
    if (request.assigneeIds.length) query.set('assigneeIds', request.assigneeIds.join(','));
    if (request.dueDate) query.set('dueDate', request.dueDate);
    if (request.estimatedHours !== undefined) query.set('estimatedHours', String(request.estimatedHours));
    if (request.taskId) query.set('taskId', request.taskId);
    const answer = await get<{ today: string; candidates: AssignmentPreview[] }>(`/workload/preview?${query}`);
    return answer.candidates;
  },
};
