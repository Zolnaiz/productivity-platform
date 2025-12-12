import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { formatDate, formatCurrency } from '../utils/formatters';

const expenseSchema = z.object({
  name: z.string().min(1, 'Нэр шаардлагатай'),
  description: z.string().optional(),
  amount: z.number().min(1, 'Дүн шаардлагатай'),
  category: z.enum([
    'salary',
    'utility',
    'rent',
    'office_supplies',
    'marketing',
    'travel',
    'equipment',
    'software',
    'training',
    'other',
  ]),
  expenseDate: z.string().min(1, 'Зардлын огноо шаардлагатай'),
  recipientName: z.string().min(1, 'Хүлээн авагчийн нэр шаардлагатай'),
  recipientAccount: z.string().optional(),
  invoiceNumber: z.string().optional(),
  questionnaireId: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface Expense {
  id: string;
  name: string;
  description?: string;
  amount: number;
  category: string;
  status: string;
  expenseDate: string;
  paidDate?: string;
  recipientName: string;
  recipientAccount?: string;
  invoiceNumber?: string;
  attachments?: string[];
  questionnaire?: {
    id: string;
    title: string;
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('month');
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', currentPage, statusFilter, categoryFilter, dateRange],
    queryFn: () => api.get('/expenses', {
      params: {
        page: currentPage,
        limit: 10,
        status: statusFilter,
        category: categoryFilter,
        dateRange,
      },
    }),
  });

  const { data: questionnaires } = useQuery({
    queryKey: ['questionnaires', 'select'],
    queryFn: () => api.get('/questionnaires/select'),
  });

  const createMutation = useMutation({
    mutationFn: (data: ExpenseFormData) => api.post('/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showNotification('Зардал амжилттай үүсгэгдлээ', 'success');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      showNotification(error.message || 'Үүсгэхэд алдаа гарлаа', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseFormData> }) =>
      api.put(`/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showNotification('Зардал амжилттай шинэчлэгдлээ', 'success');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      showNotification(error.message || 'Шинэчлэхэд алдаа гарлаа', 'error');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/expenses/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showNotification('Зардал амжилттай баталгаажлаа', 'success');
      setIsApproveModalOpen(false);
    },
    onError: (error: any) => {
      showNotification(error.message || 'Баталгаажуулахад алдаа гарлаа', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/expenses/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showNotification('Зардал амжилттай татгалзлаа', 'success');
      setIsRejectModalOpen(false);
    },
    onError: (error: any) => {
      showNotification(error.message || 'Татгалзахад алдаа гарлаа', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showNotification('Зардал амжилттай устгагдлаа', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Устгахад алдаа гарлаа', 'error');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  });

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    Object.entries(expense).forEach(([key, value]) => {
      if (key in expenseSchema.shape) {
        setValue(key as any, value);
      }
    });
    setIsModalOpen(true);
  };

  const handleApprove = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsApproveModalOpen(true);
  };

  const handleReject = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsRejectModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Та энэ зардлыг устгахдаа итгэлтэй байна уу?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: ExpenseFormData) => {
    if (selectedExpense) {
      updateMutation.mutate({ id: selectedExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paid':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Баталгаажсан';
      case 'paid':
        return 'Төлбөр төлсөн';
      case 'pending':
        return 'Хүлээгдэж байна';
      case 'rejected':
        return 'Татгалзсан';
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'salary':
        return 'Цалин';
      case 'utility':
        return 'Хэрэглээ';
      case 'rent':
        return 'Түрээс';
      case 'office_supplies':
        return 'Оффисын материал';
      case 'marketing':
        return 'Маркетинг';
      case 'travel':
        return 'Аялал';
      case 'equipment':
        return 'Тоног төхөөрөмж';
      case 'software':
        return 'Програм хангамж';
      case 'training':
        return 'Сургалт';
      case 'other':
        return 'Бусад';
      default:
        return category;
    }
  };

  const columns = [
    {
      header: 'Зардал',
      accessor: 'name',
      cell: (value: string, row: Expense) => (
        <div>
          <div className="font-medium">{value}</div>
          {row.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Дүн',
      accessor: 'amount',
      cell: (value: number) => (
        <div className="font-bold">
          {formatCurrency(value)}
        </div>
      ),
    },
    {
      header: 'Ангилал',
      accessor: 'category',
      cell: (value: string) => getCategoryLabel(value),
    },
    {
      header: 'Статус',
      accessor: 'status',
      cell: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {getStatusLabel(value)}
        </span>
      ),
    },
    {
      header: 'Огноо',
      accessor: 'expenseDate',
      cell: (value: string) => formatDate(value, 'YYYY-MM-DD'),
    },
    {
      header: 'Хүлээн авагч',
      accessor: 'recipientName',
      cell: (value: string, row: Expense) => (
        <div>
          <div>{value}</div>
          {row.invoiceNumber && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {row.invoiceNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Үйлдэл',
      accessor: 'id',
      cell: (value: string, row: Expense) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
          >
            Дэлгэрэнгүй
          </Button>
          {row.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={() => handleApprove(row)}
                disabled={approveMutation.isLoading}
              >
                Баталгаажуулах
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleReject(row)}
                disabled={rejectMutation.isLoading}
              >
                Татгалзах
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(value)}
          >
            Устгах
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Зардлууд</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Бүртгэлтэй зардлын жагсаалт
          </p>
        </div>
        <Button onClick={() => {
          setSelectedExpense(null);
          reset();
          setIsModalOpen(true);
        }}>
          Шинэ зардал
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Статус
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Бүх статус</option>
              <option value="pending">Хүлээгдэж байна</option>
              <option value="approved">Баталгаажсан</option>
              <option value="paid">Төлбөр төлсөн</option>
              <option value="rejected">Татгалзсан</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Ангилал
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Бүх ангилал</option>
              <option value="salary">Цалин</option>
              <option value="utility">Хэрэглээ</option>
              <option value="rent">Түрээс</option>
              <option value="office_supplies">Оффисын материал</option>
              <option value="marketing">Маркетинг</option>
              <option value="travel">Аялал</option>
              <option value="equipment">Тоног төхөөрөмж</option>
              <option value="software">Програм хангамж</option>
              <option value="training">Сургалт</option>
              <option value="other">Бусад</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Хугацаа
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="today">Өнөөдөр</option>
              <option value="week">Энэ долоо хоног</option>
              <option value="month">Энэ сар</option>
              <option value="quarter">Энэ улирал</option>
              <option value="year">Энэ жил</option>
              <option value="all">Бүх цаг үе</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setCategoryFilter('');
                setDateRange('month');
                setCurrentPage(1);
              }}
              className="w-full"
            >
              Цэвэрлэх
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Нийт зардал</div>
          <div className="text-2xl font-bold">
            {expensesData?.data?.data?.total || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Нийт дүн</div>
          <div className="text-2xl font-bold">
            {formatCurrency(expensesData?.data?.data?.totalAmount || 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Хүлээгдэж байна</div>
          <div className="text-2xl font-bold text-yellow-600">
            {expensesData?.data?.data?.pendingCount || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Баталгаажсан</div>
          <div className="text-2xl font-bold text-green-600">
            {expensesData?.data?.data?.approvedCount || 0}
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loading size="lg" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={expensesData?.data?.data?.expenses || []}
            pagination
            currentPage={currentPage}
            totalPages={expensesData?.data?.data?.totalPages || 1}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Category Breakdown */}
      {expensesData?.data?.data?.categoryBreakdown && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Ангилалаар нь хуваарилалт</h3>
          <div className="space-y-3">
            {Object.entries(expensesData.data.data.categoryBreakdown).map(([category, data]: [string, any]) => (
              <div key={category} className="flex items-center">
                <div className="w-32">
                  <span className="text-sm font-medium">{getCategoryLabel(category)}</span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${data.percentage}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="w-24 text-right">
                  <span className="font-medium">{formatCurrency(data.amount)}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    ({data.percentage?.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedExpense ? 'Зардал засах' : 'Шинэ зардал'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Зардлын нэр"
              {...register('name')}
              error={errors.name?.message}
              required
            />
            <Input
              label="Дүн"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              error={errors.amount?.message}
              required
            />
            <div>
              <label className="block text-sm font-medium mb-1">
                Ангилал
              </label>
              <select
                {...register('category')}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">Ангилал сонгох</option>
                <option value="salary">Цалин</option>
                <option value="utility">Хэрэглээ</option>
                <option value="rent">Түрээс</option>
                <option value="office_supplies">Оффисын материал</option>
                <option value="marketing">Маркетинг</option>
                <option value="travel">Аялал</option>
                <option value="equipment">Тоног төхөөрөмж</option>
                <option value="software">Програм хангамж</option>
                <option value="training">Сургалт</option>
                <option value="other">Бусад</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
            <Input
              label="Зардлын огноо"
              type="date"
              {...register('expenseDate')}
              error={errors.expenseDate?.message}
              required
            />
            <Input
              label="Хүлээн авагчийн нэр"
              {...register('recipientName')}
              error={errors.recipientName?.message}
              required
            />
            <Input
              label="Хүлээн авагчийн данс"
              {...register('recipientAccount')}
              error={errors.recipientAccount?.message}
            />
            <Input
              label="Нэхэмжлэхийн дугаар"
              {...register('invoiceNumber')}
              error={errors.invoiceNumber?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Холбогдох асуулга
            </label>
            <select
              {...register('questionnaireId')}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Асуулга сонгох (сонголттой)</option>
              {questionnaires?.data?.data?.map((q: any) => (
                <option key={q.id} value={q.id}>
                  {q.title}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Тайлбар"
            {...register('description')}
            error={errors.description?.message}
            multiline
            rows={3}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Цуцлах
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {(createMutation.isLoading || updateMutation.isLoading) ? (
                <Loading size="sm" />
              ) : selectedExpense ? (
                'Шинэчлэх'
              ) : (
                'Үүсгэх'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Зардал баталгаажуулах"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Та "{selectedExpense?.name}" зардлыг баталгаажуулахдаа итгэлтэй байна уу?
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Дүн:</span>
              <span className="font-bold">{formatCurrency(selectedExpense?.amount || 0)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-400">Ангилал:</span>
              <span>{getCategoryLabel(selectedExpense?.category || '')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Хүлээн авагч:</span>
              <span>{selectedExpense?.recipientName}</span>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsApproveModalOpen(false)}
            >
              Цуцлах
            </Button>
            <Button
              variant="success"
              onClick={() => {
                if (selectedExpense) {
                  approveMutation.mutate(selectedExpense.id);
                }
              }}
              disabled={approveMutation.isLoading}
            >
              {approveMutation.isLoading ? <Loading size="sm" /> : 'Баталгаажуулах'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Зардал татгалзах"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Та "{selectedExpense?.name}" зардлыг татгалзахдаа итгэлтэй байна уу?
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              Тэмдэглэл: Татгалзсан зардлыг дахин сэргээх боломжгүй.
              Шаардлагатай бол засварлаад дахин илгээнэ үү.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Цуцлах
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (selectedExpense) {
                  rejectMutation.mutate(selectedExpense.id);
                }
              }}
              disabled={rejectMutation.isLoading}
            >
              {rejectMutation.isLoading ? <Loading size="sm" /> : 'Татгалзах'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExpensesPage;