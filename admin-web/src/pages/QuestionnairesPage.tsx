import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { formatDate } from '../utils/formatters';

interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  isActive: boolean;
  responseCount: number;
  averageScore?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    name: string;
  };
}

const QuestionnairesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: questionnairesData, isLoading } = useQuery({
    queryKey: ['questionnaires', currentPage, statusFilter, typeFilter],
    queryFn: () => api.get('/questionnaires', {
      params: {
        page: currentPage,
        limit: 10,
        status: statusFilter,
        type: typeFilter,
      },
    }),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/questionnaires/${id}/publish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      showNotification('Асуулга амжилттай нийтлэгдлээ', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Нийтлэхэд алдаа гарлаа', 'error');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/questionnaires/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      showNotification('Асуулга амжилттай архивлалаа', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Архивлахад алдаа гарлаа', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/questionnaires/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
      showNotification('Асуулга амжилттай устгагдлаа', 'success');
      setIsDeleteModalOpen(false);
    },
    onError: (error: any) => {
      showNotification(error.message || 'Устгахад алдаа гарлаа', 'error');
    },
  });

  const handlePublish = (id: string) => {
    publishMutation.mutate(id);
  };

  const handleArchive = (id: string) => {
    archiveMutation.mutate(id);
  };

  const handleDelete = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedQuestionnaire) {
      deleteMutation.mutate(selectedQuestionnaire.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Нийтлэгдсэн';
      case 'draft':
        return 'Ноорог';
      case 'archived':
        return 'Архивлагдсан';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'survey':
        return 'Судалгаа';
      case 'quiz':
        return 'Шалгалт';
      case 'evaluation':
        return 'Үнэлгээ';
      case 'feedback':
        return 'Санал хүсэлт';
      default:
        return type;
    }
  };

  const columns = [
    {
      header: 'Асуулга',
      accessor: 'title',
      cell: (value: string, row: Questionnaire) => (
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
      cell: (value: string) => getTypeLabel(value),
    },
    {
      header: 'Статус',
      accessor: 'status',
      cell: (value: string, row: Questionnaire) => (
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
            {getStatusLabel(value)}
          </span>
          {!row.isActive && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
              Идэвхгүй
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Хариулт',
      accessor: 'responseCount',
      cell: (value: number, row: Questionnaire) => (
        <div className="text-center">
          <div className="font-medium">{value}</div>
          {row.averageScore !== undefined && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {row.averageScore.toFixed(1)} дундаж
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Хугацаа',
      accessor: 'startDate',
      cell: (value: string, row: Questionnaire) => (
        <div>
          {row.startDate && row.endDate ? (
            <>
              <div className="text-sm">{formatDate(row.startDate, 'YYYY-MM-DD')}</div>
              <div className="text-xs text-gray-500">-</div>
              <div className="text-sm">{formatDate(row.endDate, 'YYYY-MM-DD')}</div>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Тодорхойгүй</span>
          )}
        </div>
      ),
    },
    {
      header: 'Үүсгэсэн',
      accessor: 'createdAt',
      cell: (value: string) => formatDate(value, 'YYYY-MM-DD'),
    },
    {
      header: 'Үйлдэл',
      accessor: 'id',
      cell: (value: string, row: Questionnaire) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/questionnaires/${value}`)}
          >
            Дэлгэрэнгүй
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/questionnaires/${value}/edit`)}
          >
            Засах
          </Button>
          {row.status === 'draft' && (
            <Button
              size="sm"
              variant="success"
              onClick={() => handlePublish(value)}
              disabled={publishMutation.isLoading}
            >
              Нийтлэх
            </Button>
          )}
          {row.status === 'published' && (
            <Button
              size="sm"
              variant="warning"
              onClick={() => handleArchive(value)}
              disabled={archiveMutation.isLoading}
            >
              Архивлах
            </Button>
          )}
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row)}
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
          <h1 className="text-2xl font-bold">Асуулгууд</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Бүртгэлтэй асуулгуудын жагсаалт
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate('/questionnaires/new')}
          >
            Шинэ асуулга
          </Button>
          <Button
            onClick={() => navigate('/responses')}
          >
            Хариултууд харах
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Бүх статус</option>
              <option value="draft">Ноорог</option>
              <option value="published">Нийтлэгдсэн</option>
              <option value="archived">Архивлагдсан</option>
            </select>
          </div>
          <div className="flex-1">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Бүх төрөл</option>
              <option value="survey">Судалгаа</option>
              <option value="quiz">Шалгалт</option>
              <option value="evaluation">Үнэлгээ</option>
              <option value="feedback">Санал хүсэлт</option>
            </select>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setCurrentPage(1);
              }}
            >
              Цэвэрлэх
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Нийт асуулга</div>
          <div className="text-2xl font-bold">
            {questionnairesData?.data?.data?.total || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Нийтлэгдсэн</div>
          <div className="text-2xl font-bold text-green-600">
            {questionnairesData?.data?.data?.publishedCount || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Ноорог</div>
          <div className="text-2xl font-bold text-yellow-600">
            {questionnairesData?.data?.data?.draftCount || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Нийт хариулт</div>
          <div className="text-2xl font-bold">
            {questionnairesData?.data?.data?.totalResponses?.toLocaleString() || 0}
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
            data={questionnairesData?.data?.data?.questionnaires || []}
            pagination
            currentPage={currentPage}
            totalPages={questionnairesData?.data?.data?.totalPages || 1}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Асуулга устгах"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Та "{selectedQuestionnaire?.title}" асуулгыг устгахдаа итгэлтэй байна уу?
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Анхаар: Энэ үйлдлийг буцаах боломжгүй. Асуулгатай холбоотой бүх хариулт,
            тайлан, статистик мэдээлэл устгагдана.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Цуцлах
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleteMutation.isLoading}
            >
              {deleteMutation.isLoading ? <Loading size="sm" /> : 'Устгах'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuestionnairesPage;