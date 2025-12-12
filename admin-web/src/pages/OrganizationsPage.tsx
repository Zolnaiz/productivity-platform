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
import { formatDate, formatCurrency } from '../utils/formatters';

const organizationSchema = z.object({
  name: z.string().min(1, 'Нэр шаардлагатай'),
  email: z.string().email('И-мэйл хаяг буруу'),
  phone: z.string().min(8, 'Утасны дугаар буруу'),
  address: z.string().min(1, 'Хаяг шаардлагатай'),
  taxNumber: z.string().min(1, 'Татварын дугаар шаардлагатай'),
  industry: z.string().min(1, 'Салбар шаардлагатай'),
  employeeCount: z.number().min(1, 'Ажилчдын тоо шаардлагатай'),
  contactPersonName: z.string().min(1, 'Холбогдох хүний нэр шаардлагатай'),
  contactPersonPosition: z.string().min(1, 'Албан тушаал шаардлагатай'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  status: string;
  industry: string;
  employeeCount: number;
  contactPersonName: string;
  contactPersonPosition: string;
  createdAt: string;
  updatedAt: string;
}

const OrganizationsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const { showNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => api.get('/organizations'),
  });

  const { data: stats } = useQuery({
    queryKey: ['organizations', 'stats'],
    queryFn: () => api.get('/organizations/stats'),
  });

  const createMutation = useMutation({
    mutationFn: (data: OrganizationFormData) =>
      api.post('/organizations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      showNotification('Байгууллага амжилттай үүсгэгдлээ', 'success');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      showNotification(error.message || 'Үүсгэхэд алдаа гарлаа', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OrganizationFormData> }) =>
      api.put(`/organizations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      showNotification('Байгууллага амжилттай шинэчлэгдлээ', 'success');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      showNotification(error.message || 'Шинэчлэхэд алдаа гарлаа', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      showNotification('Байгууллага амжилттай устгагдлаа', 'success');
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
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
  });

  const handleEdit = (organization: Organization) => {
    setEditingOrganization(organization);
    Object.entries(organization).forEach(([key, value]) => {
      if (key in organizationSchema.shape) {
        setValue(key as any, value);
      }
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Та энэ байгууллагыг устгахдаа итгэлтэй байна уу?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: OrganizationFormData) => {
    if (editingOrganization) {
      updateMutation.mutate({ id: editingOrganization.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      header: 'Нэр',
      accessor: 'name',
      cell: (value: string, row: Organization) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.industry}
          </div>
        </div>
      ),
    },
    {
      header: 'Холбоо барих',
      accessor: 'email',
      cell: (value: string, row: Organization) => (
        <div>
          <div>{value}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {row.phone}
          </div>
        </div>
      ),
    },
    {
      header: 'Татвар',
      accessor: 'taxNumber',
    },
    {
      header: 'Ажилчид',
      accessor: 'employeeCount',
      cell: (value: number) => (
        <div className="text-right">
          {value.toLocaleString()} хүн
        </div>
      ),
    },
    {
      header: 'Статус',
      accessor: 'status',
      cell: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
          value === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        }`}>
          {value === 'active' ? 'Идэвхтэй' :
           value === 'pending' ? 'Хүлээгдэж байна' :
           'Идэвхгүй'}
        </span>
      ),
    },
    {
      header: 'Үүсгэсэн',
      accessor: 'createdAt',
      cell: (value: string) => formatDate(value),
    },
    {
      header: 'Үйлдэл',
      accessor: 'id',
      cell: (value: string, row: Organization) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
          >
            Засах
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(value)}
            disabled={deleteMutation.isLoading}
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
          <h1 className="text-2xl font-bold">Байгууллагууд</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Бүртгэлтэй байгууллагуудын жагсаалт
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingOrganization(null);
            reset();
            setIsModalOpen(true);
          }}
        >
          Шинэ байгууллага
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Нийт байгууллага</div>
          <div className="text-2xl font-bold">{stats?.data?.data?.total || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Идэвхтэй</div>
          <div className="text-2xl font-bold text-green-600">
            {stats?.data?.data?.active || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Хүлээгдэж байна</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats?.data?.data?.pending || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Нийт ажилчид</div>
          <div className="text-2xl font-bold">
            {stats?.data?.data?.totalEmployees?.toLocaleString() || 0}
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
            data={organizations?.data?.data?.organizations || []}
            searchable
            pagination
            itemsPerPage={10}
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrganization ? 'Байгууллага засах' : 'Шинэ байгууллага'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Байгууллагын нэр"
              {...register('name')}
              error={errors.name?.message}
              required
            />
            <Input
              label="И-мэйл хаяг"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              required
            />
            <Input
              label="Утасны дугаар"
              {...register('phone')}
              error={errors.phone?.message}
              required
            />
            <Input
              label="Татварын дугаар"
              {...register('taxNumber')}
              error={errors.taxNumber?.message}
              required
            />
            <Input
              label="Салбар"
              {...register('industry')}
              error={errors.industry?.message}
              required
            />
            <Input
              label="Ажилчдын тоо"
              type="number"
              {...register('employeeCount', { valueAsNumber: true })}
              error={errors.employeeCount?.message}
              required
            />
            <Input
              label="Холбогдох хүний нэр"
              {...register('contactPersonName')}
              error={errors.contactPersonName?.message}
              required
            />
            <Input
              label="Албан тушаал"
              {...register('contactPersonPosition')}
              error={errors.contactPersonPosition?.message}
              required
            />
          </div>
          <Input
            label="Хаяг"
            {...register('address')}
            error={errors.address?.message}
            required
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
              ) : editingOrganization ? (
                'Шинэчлэх'
              ) : (
                'Үүсгэх'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizationsPage;