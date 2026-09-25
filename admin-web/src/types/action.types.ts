/**
 * Something on the action list, as keys and parts rather than sentences.
 *
 * Each item carried English sentences built in the service - "Overdue task",
 * "Due 2026-06-18", "25% complete" - so a Mongolian reader got English in the
 * middle of their own page. The English stays as the fallback, for an item
 * whose key this build does not know; a screen words the key.
 */
export interface ActionItem {
  id: string;
  type: 'overdue' | 'task' | 'project' | 'audit' | 'assessment' | 'expense';
  title: string;
  titleKey?: string;
  titleParams?: Record<string, string | number>;
  message: string;
  /** Set when the message is itself a raised title, such as a task's. */
  messageKey?: string;
  messageParams?: Record<string, string | number>;
  meta: string;
  metaKey?: string;
  metaParams?: Record<string, string | number>;
  path: string;
  priority: 'high' | 'medium' | 'low';
}
