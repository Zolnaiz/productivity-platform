import { get, isDemoMode, patch, post } from './api';

export type FeedbackKind = 'bug' | 'suggestion' | 'question';

export interface FeedbackMessage {
  id: string;
  authorId: string;
  kind: FeedbackKind;
  message: string;
  page: string;
  readAt?: string | null;
  createdAt: string;
}

export const feedbackService = {
  send: (data: { kind: FeedbackKind; message: string; page?: string }) =>
    isDemoMode() ? Promise.resolve(undefined) : post<FeedbackMessage>('/feedback', data),

  list: () => (isDemoMode() ? Promise.resolve<FeedbackMessage[]>([]) : get<FeedbackMessage[]>('/feedback')),

  markRead: (id: string) => patch<FeedbackMessage>(`/feedback/${id}/read`),
};
