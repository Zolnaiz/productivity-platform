import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import { financeService } from '../services/finance.service';
import { operationsService } from '../services/operations.service';
import { ExpenseItem } from '../types/finance.types';
import { Project } from '../types/operations.types';

const formatMnt = (value: number) =>
  new Intl.NumberFormat('mn-MN', {
    style: 'currency',
    currency: 'MNT',
    maximumFractionDigits: 0,
  }).format(value);

const statusClasses = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
  submitted: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [draft, setDraft] = useState({
    title: '',
    projectId: '',
    amount: '0',
    category: 'other' as ExpenseItem['category'],
    expenseDate: new Date().toISOString().slice(0, 10),
    note: '',
  });

  useEffect(() => {
    financeService.getExpenses().then(setExpenses);
    operationsService.getProjects().then((items) => {
      setProjects(items);
      setDraft((current) => ({ ...current, projectId: items[0]?.id || '' }));
    });
  }, []);

  const projectById = useMemo(() => Object.fromEntries(projects.map((project) => [project.id, project])), [projects]);
  const totalSubmitted = expenses
    .filter((expense) => expense.status === 'submitted')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const totalApproved = expenses
    .filter((expense) => expense.status === 'approved')
    .reduce((sum, expense) => sum + expense.amount, 0);
  const totalAll = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const createExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    const expense = await financeService.createExpense({
      title: draft.title,
      projectId: draft.projectId,
      amount: Number(draft.amount || 0),
      category: draft.category,
      expenseDate: draft.expenseDate,
      submittedBy: 'Demo Owner',
      status: 'submitted',
      note: draft.note,
    });
    setExpenses((current) => [expense, ...current]);
    setDraft({
      title: '',
      projectId: projects[0]?.id || '',
      amount: '0',
      category: 'other',
      expenseDate: new Date().toISOString().slice(0, 10),
      note: '',
    });
  };

  const updateStatus = async (expense: ExpenseItem, status: ExpenseItem['status']) => {
    const updated = await financeService.updateExpense(expense.id, { status });
    setExpenses((current) => current.map((item) => (item.id === expense.id ? updated : item)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Expenses</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Track project expenses, approval status, and budget impact for monthly reporting.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">Total expenses</div>
          <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{formatMnt(totalAll)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Approved</div>
          <div className="mt-2 text-xl font-semibold text-green-600">{formatMnt(totalApproved)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Waiting approval</div>
          <div className="mt-2 text-xl font-semibold text-yellow-600">{formatMnt(totalSubmitted)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Records</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{expenses.length}</div>
        </Card>
      </div>

      <Card title="New expense">
        <form onSubmit={createExpense} className="grid gap-3 lg:grid-cols-6">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-2"
            placeholder="Expense title"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={draft.projectId}
            onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value }))}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={draft.category}
            onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as ExpenseItem['category'] }))}
          >
            <option value="tools">Tools</option>
            <option value="travel">Travel</option>
            <option value="materials">Materials</option>
            <option value="software">Software</option>
            <option value="other">Other</option>
          </select>
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            min="0"
            step="1000"
            type="number"
            value={draft.amount}
            onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
            Submit
          </button>
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            type="date"
            value={draft.expenseDate}
            onChange={(event) => setDraft((current) => ({ ...current, expenseDate: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-5"
            placeholder="Note"
            value={draft.note}
            onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
          />
        </form>
      </Card>

      <Card title="Expense approvals">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500 dark:border-gray-700">
              <tr>
                <th className="py-3">Expense</th>
                <th className="py-3">Project</th>
                <th className="py-3">Category</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Status</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b dark:border-gray-700">
                  <td className="py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{expense.title}</div>
                    <div className="text-xs text-gray-500">{expense.expenseDate} - {expense.submittedBy}</div>
                  </td>
                  <td className="py-3">{expense.projectId ? projectById[expense.projectId]?.name || '-' : '-'}</td>
                  <td className="py-3 capitalize">{expense.category}</td>
                  <td className="py-3 font-medium">{formatMnt(expense.amount)}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClasses[expense.status]}`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      {expense.status !== 'approved' && (
                        <button className="text-xs font-medium text-green-600" onClick={() => updateStatus(expense, 'approved')} type="button">
                          Approve
                        </button>
                      )}
                      {expense.status !== 'rejected' && (
                        <button className="text-xs font-medium text-red-600" onClick={() => updateStatus(expense, 'rejected')} type="button">
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ExpensesPage;
