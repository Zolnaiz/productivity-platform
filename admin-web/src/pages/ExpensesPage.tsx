import React, { useEffect, useMemo, useState } from 'react';
import { Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Table from '../components/common/Table';
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
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState({
    title: '',
    projectId: '',
    amount: '0',
    category: 'other' as ExpenseItem['category'],
    expenseDate: new Date().toISOString().slice(0, 10),
    note: '',
  });

  useEffect(() => {
    Promise.all([financeService.getExpenses(), operationsService.getProjects()])
      .then(([expenseItems, projectItems]) => {
        setExpenses(expenseItems);
        setProjects(projectItems);
        setDraft((current) => ({ ...current, projectId: projectItems[0]?.id || '' }));
      })
      .finally(() => setLoading(false));
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('expenses.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('expenses.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">{t('expenses.totalExpenses')}</div>
          <div className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{formatMnt(totalAll)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('expenses.approved')}</div>
          <div className="mt-2 text-xl font-semibold text-green-600">{formatMnt(totalApproved)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('expenses.waiting')}</div>
          <div className="mt-2 text-xl font-semibold text-yellow-600">{formatMnt(totalSubmitted)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('expenses.records')}</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{expenses.length}</div>
        </Card>
      </div>

      <Card title={t('expenses.newExpense')}>
        <form onSubmit={createExpense} className="grid items-end gap-3 lg:grid-cols-6">
          <Input
            className="lg:col-span-2"
            label={t('expenses.expenseTitle')}
            placeholder={t('expenses.expenseTitle')}
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
          <Select
            label={t('expenses.project')}
            value={draft.projectId}
            onChange={(event) => setDraft((current) => ({ ...current, projectId: event.target.value }))}
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          <Select
            label={t('expenses.category')}
            value={draft.category}
            onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as ExpenseItem['category'] }))}
          >
            <option value="tools">{t('expenses.categories.tools')}</option>
            <option value="travel">{t('expenses.categories.travel')}</option>
            <option value="materials">{t('expenses.categories.materials')}</option>
            <option value="software">{t('expenses.categories.software')}</option>
            <option value="other">{t('expenses.categories.other')}</option>
          </Select>
          <Input
            label={t('expenses.amount')}
            min="0"
            step="1000"
            type="number"
            value={draft.amount}
            onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
          />
          <Input
            label={t('expenses.expenseDate')}
            type="date"
            value={draft.expenseDate}
            onChange={(event) => setDraft((current) => ({ ...current, expenseDate: event.target.value }))}
          />
          <Input
            className="lg:col-span-5"
            label={t('expenses.note')}
            placeholder={t('expenses.note')}
            value={draft.note}
            onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
          />
          <Button type="submit">{t('expenses.submit')}</Button>
        </form>
      </Card>

      <Card title={t('expenses.approvals')} loading={loading}>
        <Table
          rows={expenses}
          rowKey={(expense) => expense.id}
          columns={[
            {
              key: 'title',
              header: t('expenses.expense'),
              render: (expense) => (
                <>
                  <div className="font-medium text-gray-900 dark:text-white">{expense.title}</div>
                  <div className="text-xs text-gray-500">
                    {expense.expenseDate} - {expense.submittedBy}
                  </div>
                </>
              ),
            },
            {
              key: 'project',
              header: t('expenses.project'),
              render: (expense) => (expense.projectId ? projectById[expense.projectId]?.name || '-' : '-'),
            },
            { key: 'category', header: t('expenses.category'), className: 'py-3 capitalize' },
            {
              key: 'amount',
              header: t('expenses.amount'),
              className: 'py-3 font-medium',
              render: (expense) => formatMnt(expense.amount),
            },
            {
              key: 'status',
              header: t('expenses.status'),
              render: (expense) => (
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClasses[expense.status]}`}>
                  {expense.status}
                </span>
              ),
            },
            {
              key: 'actions',
              header: t('expenses.actions'),
              render: (expense) => (
                <div className="flex gap-2">
                  {expense.status !== 'approved' && (
                    <button
                      className="text-xs font-medium text-green-600"
                      onClick={() => updateStatus(expense, 'approved')}
                      type="button"
                    >
                      {t('expenses.approve')}
                    </button>
                  )}
                  {expense.status !== 'rejected' && (
                    <button
                      className="text-xs font-medium text-red-600"
                      onClick={() => updateStatus(expense, 'rejected')}
                      type="button"
                    >
                      {t('expenses.reject')}
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          empty={
            <EmptyState
              icon={Landmark}
              title={t('expenses.emptyTitle')}
              description={t('expenses.emptyDescription')}
            />
          }
        />
      </Card>
    </div>
  );
};

export default ExpensesPage;
