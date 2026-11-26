/**
 * API client for a task's work documents and their review: /tasks/:id/deliverables (backend
 * operations/deliverables.controller.ts). Downloads go through attachmentService.loadFile like every other file.
 *
 * The demo workspace keeps the files with the demo attachments in this browser and the review state beside
 * them, applying the same order of steps (submit, then approve or return), so the flow can be shown without
 * a server. Who may do what is decided only by the server.
 */
import { api, isDemoMode, unwrapApiResponse } from './api';
import { Attachment, attachmentService } from './attachment.service';

export type ReviewStatus = 'none' | 'submitted' | 'approved' | 'returned';

export interface DeliverableReview {
  status: ReviewStatus;
  note: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
}

export interface DeliverableFile extends Attachment {
  version: number;
  uploadedBy?: string;
}

export interface TaskDeliverables {
  review: DeliverableReview;
  files: DeliverableFile[];
}

const demoKey = 'productivity-demo-deliverables';
const emptyReview: DeliverableReview = { status: 'none', note: null, reviewedBy: null, reviewedAt: null, submittedAt: null };

const readDemoReviews = (): Record<string, DeliverableReview> => {
  try {
    return JSON.parse(localStorage.getItem(demoKey) || '{}');
  } catch {
    return {};
  }
};

const writeDemoReview = (taskId: string, review: DeliverableReview) => {
  try {
    localStorage.setItem(demoKey, JSON.stringify({ ...readDemoReviews(), [taskId]: review }));
  } catch {
    // A private window keeps nothing; the page still works for the visit.
  }
};

/** Oldest = version 1, listed newest first: the same numbering as the server. */
const numberVersions = (files: Attachment[]): DeliverableFile[] =>
  [...files]
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .map((file, index) => ({ ...file, version: index + 1 }))
    .reverse();

const demoView = async (taskId: string): Promise<TaskDeliverables> => ({
  review: readDemoReviews()[taskId] ?? emptyReview,
  files: numberVersions(await attachmentService.list('work_task', taskId)),
});

const demoStep = async (taskId: string, review: Partial<DeliverableReview>) => {
  writeDemoReview(taskId, { ...(readDemoReviews()[taskId] ?? emptyReview), ...review });
  return demoView(taskId);
};

const base = (taskId: string) => `/tasks/${taskId}/deliverables`;
const send = async (request: Promise<{ data: TaskDeliverables | { data: TaskDeliverables } }>) =>
  unwrapApiResponse((await request).data);

export const deliverablesService = {
  list: (taskId: string): Promise<TaskDeliverables> =>
    isDemoMode() ? demoView(taskId) : send(api.get(base(taskId))),

  upload: async (taskId: string, file: File): Promise<TaskDeliverables> => {
    if (isDemoMode()) {
      await attachmentService.upload(file, { ownerType: 'work_task', ownerId: taskId, kind: 'deliverable' });
      return demoView(taskId);
    }
    const form = new FormData();
    form.append('file', file);
    return send(api.post(base(taskId), form));
  },

  remove: async (taskId: string, attachmentId: string): Promise<TaskDeliverables> => {
    if (isDemoMode()) {
      await attachmentService.remove(attachmentId);
      return demoView(taskId);
    }
    return send(api.delete(`${base(taskId)}/${attachmentId}`));
  },

  submit: (taskId: string): Promise<TaskDeliverables> =>
    isDemoMode()
      ? demoStep(taskId, { status: 'submitted', submittedAt: new Date().toISOString() })
      : send(api.post(`${base(taskId)}/submit`)),

  approve: (taskId: string): Promise<TaskDeliverables> =>
    isDemoMode()
      ? demoStep(taskId, { status: 'approved', note: null, reviewedAt: new Date().toISOString() })
      : send(api.post(`${base(taskId)}/approve`)),

  returnForChanges: (taskId: string, note: string): Promise<TaskDeliverables> =>
    isDemoMode()
      ? demoStep(taskId, { status: 'returned', note, reviewedAt: new Date().toISOString() })
      : send(api.post(`${base(taskId)}/return`, { note })),

  /** Saves a file to the user's computer under the name it was uploaded with. */
  download: async (file: Attachment) => {
    const url = await attachmentService.loadFile(file);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => attachmentService.releaseFile(url), 1000);
  },
};
