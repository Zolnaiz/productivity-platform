import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { formatDate } from '../utils/formatters';

const generateReportSchema = z.object({
  type: z.enum(['questionnaire', 'expense', 'combined', 'custom']),
  title: z.string().min(1, 'Гарчиг шаардлагатай'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Эхлэх огноо шаардлагатай'),
  endDate: z.string().min(1, 'Дуусах огноо шаардлагатай'),
  questionnaireId: z.string().optional(),
  organizationId: z.string().optional(),
});

type GenerateReportFormData = z.infer<typeof generateReportSchema>;

interface Report {
  id: string;
  type: string;
  title: string;
  description?: string;
  status: string;
  exportFormat?: string;
  exportedAt?: string;
  generatedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ReportsPage: React.FC = () => {
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports', currentPage, typeFilter, statusFilter],
    queryFn: () => api.get('/reports', {
      params: {
        page: currentPage,
        limit: 10,
        type: typeFilter,
        status: statusFilter,
      },
    }),
  });

  const { data: organizations } = useQuery({
    queryKey: ['organizations', 'select'],
    queryFn: () => api.get('/organizations/select'),
  });

  const { data: questionnaires } = useQuery({
    queryKey: ['questionnaires', 'select'],
    queryFn: () => api.get('/questionnaires/select'),
  });

  const generateMutation = useMutation({
    mutationFn: (data: GenerateReportFormData) => api.post('/reports/generate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showNotification('Тайлан амжилттай үүсгэгдлээ', 'success');
      setIsGenerateModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      showNotification(error.message || 'Үүсгэхэд алдаа гарлаа', 'error');
    },
  });

  const quickGenerateMutation = useMutation({
    mutationFn: (data: any) => api.post('/reports/generate/quick', data),
    onSuccess: (response) => {
      showNotification('Түргэн тайлан амжилттай үүсгэгдлээ', 'success');
      // Татаж авах
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quick-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error: any) => {
      showNotification(error.message || 'Үүсгэхэд алдаа гарлаа', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      showNotification('Тайлан амжилттай устгагдлаа', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Устгахад алдаа гарлаа', 'error');
    },
  });

  const exportMutation = useMutation({
    mutationFn: ({ id, format }: { id: string; format: string }) =>
      api.get(`/reports/export/${id}/${format}`),
    onSuccess: (response) => {
      showNotification('Тайлан амжилттай экспортлогдлоо', 'success');
      setIsExportModalOpen(false);
      
      // Татаж авах
      const { downloadUrl } = response.data.data;
      window.open(downloadUrl, '_blank');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Экспортлоход алдаа гарлаа', 'error');
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<GenerateReportFormData>({
    resolver: zodResolver(generateReportSchema),
    defaultValues: {
      type: 'combined',
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    },
  });

  const reportType = watch('type');

  const handleGenerateQuickReport = () => {
    const startDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    
    quickGenerateMutation.mutate({
      startDate,
      endDate,
    });
  };

  const handleExport = (report: Report) => {
    setSelectedReport(report);
    setIsExportModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Та энэ тайланг устгахдаа итгэлтэй байна уу?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: GenerateReportFormData) => {
    generateMutation.mutate(data);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'questionnaire':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'expense':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'combined':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'custom':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'questionnaire':
        return 'Асуулга';
      case 'expense':
        return 'Зардал';
      case 'combined':
        return 'Нийт';
      case 'custom':
        return 'Захиалгат';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'exported':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Бэлэн';
      case 'exported':
        return 'Экспортлогдсон';
      case 'processing':
        return 'Боловсруулж байна';
      case 'failed':
        return 'Алдаатай';
      default:
        return status;
    }
  };

  const columns = [
    {
      header: 'Тайлан',
      accessor: 'title',
      cell: (value: string, row: Report) => (
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
      header: 'Төрөл',
      accessor: 'type',
      cell: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(value)}`}>
          {getTypeLabel(value)}
        </span>
      ),
    },
    {
      header: 'Статус',
      accessor: 'status',
      cell: (value: string, row: Report) => (
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
            {getStatusLabel(value)}
          </span>
          {row.exportFormat && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
              {row.exportFormat.toUpperCase()}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Үүсгэсэн',
      accessor: 'generatedBy',
      cell: (value: any) => (
        <div>
          {value.firstName} {value.lastName}
        </div>
      ),
    },
    {
      header: 'Үүсгэсэн огноо',
      accessor: 'createdAt',
      cell: (value: string) => formatDate(value, 'YYYY-MM-DD HH:mm'),
    },
    {
      header: 'Экспортлогдсон',
      accessor: 'exportedAt',
      cell: (value: string) => value ? formatDate(value, 'YYYY-MM-DD HH:mm') : '-',
    },
    {
      header: 'Үйлдэл',
      accessor: 'id',
      cell: (value: string, row: Report) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/api/reports/${value}/preview`, '_blank')}
          >
            Урьдчилан харах
          </Button>
          {row.status === 'completed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport(row)}
            >
              Экспортлох
            </Button>
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
          <h1 className="text-2xl font-bold">Тайлангууд</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Үүсгэсэн тайлангуудын жагсаалт
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleGenerateQuickReport}
            disabled={quickGenerateMutation.isLoading}
          >
            {quickGenerateMutation.isLoading ? <Loading size="sm" /> : 'Түргэн тайлан'}
          </Button>
          <Button onClick={() => setIsGenerateModalOpen(true)}>
            Шинэ тайлан
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Төрөл
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Бүх төрөл</option>
              <option value="questionnaire">Асуулга</option>
              <option value="expense">Зардал</option>
              <option value="combined">Нийт</option>
              <option value="custom">Захиалгат</option>
            </select>
          </div>
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
              <option value="completed">Бэлэн</option>
              <option value="processing">Боловсруулж байна</option>
              <option value="exported">Экспортлогдсон</option>
              <option value="failed">Алдаатай</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
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
          <div className="text-sm text-gray-500 dark:text-gray-400">Нийт тайлан</div>
          <div className="text-2xl font-bold">
            {reportsData?.data?.data?.total || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Бэлэн</div>
          <div className="text-2xl font-bold text-green-600">
            {reportsData?.data?.data?.completedCount || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Экспортлогдсон</div>
          <div className="text-2xl font-bold text-blue-600">
            {reportsData?.data?.data?.exportedCount || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Сүүлийн 30 хоног</div>
          <div className="text-2xl font-bold">
            {reportsData?.data?.data?.recentCount || 0}
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
            data={reportsData?.data?.data?.reports || []}
            pagination
            currentPage={currentPage}
            totalPages={reportsData?.data?.data?.totalPages || 1}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Report Types Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Асуулгын тайлан</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Асуулгын хариулт, статистик, шинжилгээ
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="text-sm font-medium text-green-700 dark:text-green-300">Зардлын тайлан</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Зардлын тайлан, ангилал, хандлага
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Нийт тайлан</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Бүх өгөгдлийн цогц шинжилгээ, KPI
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Захиалгат тайлан</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Өөрийн хүсэлтээр тохируулсан тайлан
          </div>
        </Card>
      </div>

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Шинэ тайлан үүсгэх"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Тайлангийн төрөл
              </label>
              <select
                {...register('type')}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="combined">Нийт тайлан</option>
                <option value="questionnaire">Асуулгын тайлан</option>
                <option value="expense">Зардлын тайлан</option>
                <option value="custom">Захиалгат тайлан</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>
            <Input
              label="Гарчиг"
              {...register('title')}
              error={errors.title?.message}
              required
            />
            <Input
              label="Эхлэх огноо"
              type="date"
              {...register('startDate')}
              error={errors.startDate?.message}
              required
            />
            <Input
              label="Дуусах огноо"
              type="date"
              {...register('endDate')}
              error={errors.endDate?.message}
              required
            />
          </div>

          {reportType === 'questionnaire' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Асуулга
              </label>
              <select
                {...register('questionnaireId')}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">Асуулга сонгох</option>
                {questionnaires?.data?.data?.map((q: any) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Байгууллага (сонголттой)
            </label>
            <select
              {...register('organizationId')}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Бүх байгууллага</option>
              {organizations?.data?.data?.map((org: any) => (
                <option key={org.id} value={org.id}>
                  {org.name}
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
            placeholder="Тайлангийн зорилго, хамрах хүрээг тодорхойлно уу"
          />

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm font-medium mb-2">Тайлангийн мэдээлэл:</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>• Төрөл: {getTypeLabel(reportType)}</div>
              <div>• Хугацаа: {watch('startDate')} - {watch('endDate')}</div>
              {reportType === 'questionnaire' && <div>• Тодорхой асуулгаар шүүнэ</div>}
              <div>• PDF, Excel форматаар экспортлох боломжтой</div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGenerateModalOpen(false)}
            >
              Цуцлах
            </Button>
            <Button
              type="submit"
              disabled={generateMutation.isLoading}
            >
              {generateMutation.isLoading ? <Loading size="sm" /> : 'Үүсгэх'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Тайлан экспортлох"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            "{selectedReport?.title}" тайланг ямар форматаар экспортлох вэ?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedReport) {
                  exportMutation.mutate({ id: selectedReport.id, format: 'pdf' });
                }
              }}
              disabled={exportMutation.isLoading}
            >
              PDF формат
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedReport) {
                  exportMutation.mutate({ id: selectedReport.id, format: 'excel' });
                }
              }}
              disabled={exportMutation.isLoading}
            >
              Excel формат
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedReport) {
                  exportMutation.mutate({ id: selectedReport.id, format: 'csv' });
                }
              }}
              disabled={exportMutation.isLoading}
            >
              CSV формат
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedReport) {
                  exportMutation.mutate({ id: selectedReport.id, format: 'json' });
                }
              }}
              disabled={exportMutation.isLoading}
            >
              JSON формат
            </Button>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setIsExportModalOpen(false)}
            >
              Цуцлах
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ReportsPage;
