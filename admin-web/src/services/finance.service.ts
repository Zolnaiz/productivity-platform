import { ExpenseItem } from '../types/finance.types';
import { get, isDemoMode, patch, post, shouldUseDemoFallback } from './api';

const expenseKey = 'productivity-demo-expenses';

const defaultExpenses: ExpenseItem[] = [
  {
    id: 'ex-1',
    projectId: 'p1',
    title: 'Dashboard reporting tools',
    category: 'software',
    amount: 450000,
    status: 'approved',
    expenseDate: '2026-06-10',
    submittedBy: 'Demo Owner',
    note: 'Reporting and export preparation.',
  },
  {
    id: 'ex-2',
    projectId: 'p2',
    title: '5S floor labels',
    category: 'materials',
    amount: 180000,
    status: 'submitted',
    expenseDate: '2026-06-12',
    submittedBy: 'Quality Manager',
    note: 'Visual management materials for audit actions.',
  },
];

const readExpenses = (): ExpenseItem[] => {
  const stored = localStorage.getItem(expenseKey);
  if (stored) {
    try {
      return JSON.parse(stored) as ExpenseItem[];
    } catch {
      localStorage.removeItem(expenseKey);
    }
  }
  localStorage.setItem(expenseKey, JSON.stringify(defaultExpenses));
  return defaultExpenses;
};

const writeExpenses = (items: ExpenseItem[]) => {
  localStorage.setItem(expenseKey, JSON.stringify(items));
  return items;
};

const fallback = async <T>(request: () => Promise<T>, demoData: T): Promise<T> => {
  if (isDemoMode()) return demoData;
  try {
    return await request();
  } catch {
    if (!shouldUseDemoFallback()) {
      throw new Error('Backend request failed and demo fallback is disabled in production.');
    }
    return demoData;
  }
};

export const financeService = {
  getExpenses: () => fallback<ExpenseItem[]>(() => get('/expenses'), readExpenses()),
  createExpense: (data: Omit<ExpenseItem, 'id'>) => {
    if (!isDemoMode()) {
      return post<ExpenseItem>('/expenses', data);
    }

    const item: ExpenseItem = { ...data, id: `local-expense-${Date.now()}` };
    writeExpenses([item, ...readExpenses()]);
    return Promise.resolve(item);
  },
  updateExpense: (id: string, data: Partial<ExpenseItem>) => {
    if (!isDemoMode()) {
      return patch<ExpenseItem>(`/expenses/${id}`, data);
    }

    const updated = readExpenses().map((expense) => (expense.id === id ? { ...expense, ...data } : expense));
    writeExpenses(updated);
    return Promise.resolve(updated.find((expense) => expense.id === id) as ExpenseItem);
  },
};
