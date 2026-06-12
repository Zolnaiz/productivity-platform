export interface ExpenseItem {
  id: string;
  projectId?: string;
  title: string;
  category: 'tools' | 'travel' | 'materials' | 'software' | 'other';
  amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  expenseDate: string;
  submittedBy: string;
  note?: string;
}
