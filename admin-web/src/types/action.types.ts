export interface ActionItem {
  id: string;
  type: 'overdue' | 'task' | 'project' | 'audit' | 'assessment' | 'expense';
  title: string;
  message: string;
  meta: string;
  path: string;
  priority: 'high' | 'medium' | 'low';
}
