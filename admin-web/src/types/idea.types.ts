export type IdeaStatus = 'submitted' | 'approved' | 'declined' | 'done';

export interface Idea {
  id: string;
  authorId?: string;
  title: string;
  description: string;
  area: string;
  benefit: string;
  status: IdeaStatus;
  reviewerId?: string;
  reviewNote: string;
  reviewedAt?: string | null;
  taskId?: string;
  createdAt?: string;
}

export interface NewIdea {
  title: string;
  description?: string;
  area?: string;
  benefit?: string;
}

export interface IdeaDecision {
  status: Exclude<IdeaStatus, 'submitted'>;
  note?: string;
  assigneeId?: string;
  dueDate?: string;
}
