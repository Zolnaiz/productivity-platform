import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Button from '../components/common/Button';
import Table from '../components/common/Table';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { formatDate } from '../utils/formatters';

interface Response {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  questionnaire: {
    id: string;
    title: string;
  };
  score?: number;
  percentage?: number;
  status: string;
  submittedAt?: string;
  createdAt: string;
}

const ResponsesPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('all');

  const { data: responsesData, isLoading } = useQuery({
    queryKey: ['responses', currentPage, statusFilter, dateRange],
    queryFn: () => api.get('/responses', {
      params: {
        page: currentPage,
        limit: 10,
        status: statusFilter,
        dateRange,
      },
    }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Илгээсэн';
      case 'reviewed':
        return 'Шалгасан';
      case 'in_progress':
        return 'Хийгдэж байгаа';
      case 'rejected':
        return 'Татгалзсан';
      default:
        return status;
    }
  };

  const columns = [
    {
      header: 'Хэрэглэгч',
      accessor: 'user',
      cell: (value: any) => (
        <div>
          <div className="font-medium">
            {value.firstName} {value.lastName}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {value.email}
          </div>
        </div>
      ),
    },
    {
      header: 'Асуулга',
      accessor: 'questionnaire',
      cell: (value: any) => (
        <div className="font-medium">{value.title}</div>
      ),
    },
    {
      header: 'Оноо',
      accessor: 'score',
      cell: (value: number, row: Response) => (
        <div className="text-center">
          {value !== undefined ? (
            <>
              <div className="font-medium">{value.toFixed(1)}</div>
              {row.percentage && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {row.percentage.toFixed(1)}%
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">-</span>
          )}
        </div>
      ),
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
      header: 'Илгээсэн огноо',
      accessor: 'submittedAt',
      cell: (value: string) => value ? formatDate(value, 'YYYY-MM-DD HH:mm') : '-',
    },
    {
      header: 'Үйлдэл',
      accessor: 'id',
      cell: (value: string, row: Response) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/responses/${value}`)}
          >
            Дэлгэрэнгүй
          </Button>
          {row.status === 'submitted' && (
            <Button
              size="sm"
              variant="success"
              onClick={() => navigate(`/responses/${value}/review`)}
            >
              Шалгах
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Хариултууд</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Асуулгын хариултуудын жагсаалт
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate('/questionnaires')}
          >
            Асуулгууд руу буцах
          </Button>
          <Button onClick={() => window.print()}>
            Тайлан хэвлэх
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="in_progress">Хийгдэж байгаа</option>
              <option value="submitted">Илгээсэн</option>
              <option value="reviewed">Шалгасан</option>
              <option value="rejected">Татгалзсан</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Хугацааны хүрээ
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="all">Бүх цаг үе</option>
              <option value="today">Өнөөдөр</option>
              <option value="week">Энэ долоо хоног</option>
              <option value="month">Энэ сар</option>
              <option value="year">Энэ жил</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setDateRange('all');
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
          <div className="text-sm text-gray-500 dark:text-gray-400">Нийт хариулт</div>
          <div className="text-2xl font-bold">
            {responsesData?.data?.data?.total || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Илгээсэн</div>
          <div className="text-2xl font-bold text-green-600">
            {responsesData?.data?.data?.submittedCount || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Шалгасан</div>
          <div className="text-2xl font-bold text-blue-600">
            {responsesData?.data?.data?.reviewedCount || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Дундаж оноо</div>
          <div className="text-2xl font-bold text-purple-600">
            {responsesData?.data?.data?.averageScore?.toFixed(1) || '0.0'}%
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
            data={responsesData?.data?.data?.responses || []}
            pagination
            currentPage={currentPage}
            totalPages={responsesData?.data?.data?.totalPages || 1}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Analysis Section */}
      {responsesData?.data?.data?.analysis && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Хариултын шинжилгээ</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Онооны тархалт</h4>
              <div className="space-y-2">
                {Object.entries(responsesData.data.data.analysis.scoreDistribution || {}).map(([range, count]) => (
                  <div key={range} className="flex items-center">
                    <div className="w-24 text-sm">{range}%</div>
                    <div className="flex-1 ml-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${(Number(count) / responsesData.data.data.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm">{count}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Статистик</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Хамгийн өндөр оноо:</span>
                  <span className="font-medium">
                    {responsesData.data.data.analysis.maxScore?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Хамгийн бага оноо:</span>
                  <span className="font-medium">
                    {responsesData.data.data.analysis.minScore?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Дундаж оноо:</span>
                  <span className="font-medium">
                    {responsesData.data.data.analysis.averageScore?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Медиан:</span>
                  <span className="font-medium">
                    {responsesData.data.data.analysis.medianScore?.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Дуусах хувь:</span>
                  <span className="font-medium">
                    {responsesData.data.data.analysis.completionRate?.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResponsesPage;