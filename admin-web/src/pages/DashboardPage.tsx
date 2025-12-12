import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import KpiCard from '../components/widgets/KpiCard';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import PieChart from '../components/charts/PieChart';

interface DashboardStats {
  totals: {
    questionnaires: number;
    expenses: number;
    responses: number;
    totalExpenseAmount: number;
  };
  recentActivity: {
    recentExpenses: any[];
    topQuestionnaires: any[];
    recentResponses: any[];
  };
  charts: {
    monthlyExpenses: Record<string, number>;
    expenseByCategory: Record<string, any>;
    responseTrends: Record<string, number>;
  };
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get('/reports/dashboard/summary'),
  });

  useEffect(() => {
    if (data?.data?.data) {
      setStats(data.data.data);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          Өгөгдөл авахад алдаа гарлаа
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="p-6 bg-gradient-to-r from-primary to-primary-dark text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Сайн байна уу, {user?.firstName} {user?.lastName}!
            </h1>
            <p className="mt-2 opacity-90">
              Өнөөдөр таны хяналтын самбар
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="text-sm opacity-90">Оролцсон байгууллага</div>
            <div className="text-xl font-bold">{user?.organization?.name}</div>
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Асуулгын тоо"
          value={stats?.totals.questionnaires || 0}
          icon="📋"
          trend="+12%"
          trendType="up"
          description="Нийт идэвхтэй асуулга"
        />
        <KpiCard
          title="Хариултын тоо"
          value={stats?.totals.responses || 0}
          icon="📝"
          trend="+8%"
          trendType="up"
          description="Нийт хариулт"
        />
        <KpiCard
          title="Зардлын тоо"
          value={stats?.totals.expenses || 0}
          icon="💰"
          trend="-3%"
          trendType="down"
          description="Нийт зардал"
        />
        <KpiCard
          title="Нийт зардал"
          value={stats?.totals.totalExpenseAmount || 0}
          icon="💵"
          trend="+5%"
          trendType="up"
          description="Монгол төгрөг"
          isCurrency
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Expenses Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Сар бүрийн зардал</h3>
          <div className="h-64">
            <LineChart
              data={Object.entries(stats?.charts.monthlyExpenses || {}).map(([month, amount]) => ({
                label: month,
                value: amount,
              }))}
            />
          </div>
        </Card>

        {/* Expense by Category Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Зардлын ангилал</h3>
          <div className="h-64">
            <PieChart
              data={Object.entries(stats?.charts.expenseByCategory || {}).map(([category, data]) => ({
                label: category,
                value: data.amount || data,
              }))}
            />
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Сүүлийн зардлууд</h3>
            <button className="text-sm text-primary hover:text-primary-dark">
              Бүгдийг харах
            </button>
          </div>
          <div className="space-y-3">
            {stats?.recentActivity.recentExpenses.slice(0, 5).map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div>
                  <div className="font-medium">{expense.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {expense.category} • {expense.expenseDate}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {new Intl.NumberFormat('mn-MN', {
                      style: 'currency',
                      currency: 'MNT',
                    }).format(expense.amount)}
                  </div>
                  <div className={`text-sm ${
                    expense.status === 'approved' ? 'text-green-600' :
                    expense.status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {expense.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Questionnaires */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Оролцоо өндөр асуулгууд</h3>
            <button className="text-sm text-primary hover:text-primary-dark">
              Бүгдийг харах
            </button>
          </div>
          <div className="space-y-3">
            {stats?.recentActivity.topQuestionnaires.slice(0, 5).map((questionnaire) => (
              <div
                key={questionnaire.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div>
                  <div className="font-medium">{questionnaire.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {questionnaire.responseCount} хариулт
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{questionnaire.averageScore}%</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Дундаж оноо
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Response Trends */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Хариултын чиг хандлага</h3>
          <select className="text-sm border rounded-lg px-3 py-1 dark:bg-gray-800 dark:border-gray-700">
            <option>Сүүлийн 30 хоног</option>
            <option>Сүүлийн 90 хоног</option>
            <option>Энэ жил</option>
          </select>
        </div>
        <div className="h-72">
          <BarChart
            data={Object.entries(stats?.charts.responseTrends || {}).map(([date, count]) => ({
              label: date,
              value: count,
            }))}
          />
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;