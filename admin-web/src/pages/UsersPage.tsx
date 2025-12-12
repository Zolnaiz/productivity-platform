import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../services/api';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';
import { formatDate } from '../utils/formatters';

const userSchema = z.object({
  email: z.string().email('И-мэйл хаяг буруу байна'),
  password: z.string().min(8, 'Нууц үг дор хаяж 8 тэмдэгт байх ёстой').optional().or(z.literal('')),
  firstName: z.string().min(1, 'Овог шаардлагатай'),
  lastName: z.string().min(1, 'Нэр шаардлагатай'),
  role: z.enum(['super_admin', 'admin', 'manager', 'user', 'viewer']),
  phone: z.string().optional(),
  organizationId: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  phone?: string;
  organization?: {
    id: string;
    name: string;
  };
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

const UsersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const { showNotification } = useNotification();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', currentPage, searchTerm, roleFilter],
    queryFn: () => api.get('/users', {
      params: {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: roleFilter,
      },
    }),
  });

  const { data: organizations } = useQuery({
    queryKey: ['organizations', 'select'],
    queryFn: () => api.get('/organizations/select'),
  });

  const createMutation = useMutation({
    mutationFn: (data: UserFormData) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showNotification('Хэрэглэгч амжилттай үүсгэгдлээ', 'success');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      showNotification(error.message || 'Үүсгэхэд алдаа гарлаа', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UserFormData> }) =>
      api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showNotification('Хэрэглэгч амжилттай шинэчлэгдлээ', 'success');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      showNotification(error.message || 'Шинэчлэхэд алдаа гарлаа', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showNotification('Хэрэглэгч амжилттай устгагдлаа', 'success');
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
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'user',
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    Object.entries(user).forEach(([key, value]) => {
      if (key in userSchema.shape) {
        setValue(key as any, value);
      }
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Та энэ хэрэглэгчийг устгахдаа итгэлтэй байна уу?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: UserFormData) => {
    // Хэрэв нууц үг оруулаагүй бол нууц үгийн талбарыг устгах
    if (!data.password) {
      delete data.password;
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'user':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Супер Админ';
      case 'admin':
        return 'Админ';
      case 'manager':
        return 'Менежер';
      case 'user':
        return 'Хэрэглэгч';
      case 'viewer':
        return 'Үзэгч';
      default:
        return role;
    }
  };

  const columns = [
    {
      header: 'Хэрэглэгч',
      accessor: 'firstName',
      cell: (value: string, row: User) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
              {row.firstName.charAt(0)}{row.lastName.charAt(0)}
            </div>
          </div>
          <div>
            <div className="font-medium">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Эрх',
      accessor: 'role',
      cell: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(value)}`}>
          {getRoleLabel(value)}
        </span>
      ),
    },
    {
      header: 'Байгууллага',
      accessor: 'organization',
      cell: (value: any) => (
        <div>
          {value?.name || '-'}
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
      header: 'Сүүлд нэвтэрсэн',
      accessor: 'lastLoginAt',
      cell: (value: string) => value ? formatDate(value, 'YYYY-MM-DD HH:mm') : 'Хэзээ ч нэвтрээгүй',
    },
    {
      header: 'Үйлдэл',
      accessor: 'id',
      cell: (value: string, row: User) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEdit(row)}
            disabled={row.id === currentUser?.id}
          >
            Засах
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(value)}
            disabled={deleteMutation.isLoading || row.id === currentUser?.id}
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
          <h1 className="text-2xl font-bold">Хэрэглэгчид</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Бүртгэлтэй хэрэглэгчдийн жагсаалт
          </p>
        </div>
        <Button onClick={() => {
          setEditingUser(null);
          reset();
          setIsModalOpen(true);
        }}>
          Шинэ хэрэглэгч
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Хэрэглэгч хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex space-x-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">Бүх эрх</option>
              <option value="super_admin">Супер Админ</option>
              <option value="admin">Админ</option>
              <option value="manager">Менежер</option>
              <option value="user">Хэрэглэгч</option>
              <option value="viewer">Үзэгч</option>
            </select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
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
          <div className="text-sm text-gray-500 dark:text-gray-400">Нийт хэрэглэгч</div>
          <div className="text-2xl font-bold">
            {usersData?.data?.data?.total || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Идэвхтэй</div>
          <div className="text-2xl font-bold text-green-600">
            {usersData?.data?.data?.activeCount || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Админууд</div>
          <div className="text-2xl font-bold text-blue-600">
            {usersData?.data?.data?.adminCount || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Энгийн хэрэглэгч</div>
          <div className="text-2xl font-bold text-purple-600">
            {usersData?.data?.data?.userCount || 0}
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
            data={usersData?.data?.data?.users || []}
            pagination
            currentPage={currentPage}
            totalPages={usersData?.data?.data?.totalPages || 1}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Хэрэглэгч засах' : 'Шинэ хэрэглэгч'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="И-мэйл хаяг"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              required
              disabled={!!editingUser}
            />
            {!editingUser && (
              <Input
                label="Нууц үг"
                type="password"
                {...register('password')}
                error={errors.password?.message}
                required={!editingUser}
                placeholder="Дор хаяж 8 тэмдэгт"
              />
            )}
            <Input
              label="Овог"
              {...register('firstName')}
              error={errors.firstName?.message}
              required
            />
            <Input
              label="Нэр"
              {...register('lastName')}
              error={errors.lastName?.message}
              required
            />
            <div>
              <label className="block text-sm font-medium mb-1">
                Эрх
              </label>
              <select
                {...register('role')}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="user">Хэрэглэгч</option>
                <option value="manager">Менежер</option>
                <option value="admin">Админ</option>
                {currentUser?.role === 'super_admin' && (
                  <option value="super_admin">Супер Админ</option>
                )}
                <option value="viewer">Үзэгч</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Байгууллага
              </label>
              <select
                {...register('organizationId')}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="">Байгууллага сонгох</option>
                {organizations?.data?.data?.map((org: any) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Утасны дугаар"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>

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
              ) : editingUser ? (
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

export default UsersPage;