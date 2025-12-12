import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { api } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Овог шаардлагатай'),
  lastName: z.string().min(1, 'Нэр шаардлагатай'),
  email: z.string().email('И-мэйл хаяг буруу'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Одоогийн нууц үг шаардлагатай'),
  newPassword: z.string().min(8, 'Шинэ нууц үг дор хаяж 8 тэмдэгт байх ёстой'),
  confirmPassword: z.string().min(1, 'Нууц үг давтах шаардлагатай'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Нууц үгүүд тохирохгүй байна',
  path: ['confirmPassword'],
});

const notificationSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  reportNotifications: z.boolean().default(true),
  expenseNotifications: z.boolean().default(true),
  responseNotifications: z.boolean().default(true),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type NotificationFormData = z.infer<typeof notificationSchema>;

const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('profile');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const {
    register: registerNotifications,
    handleSubmit: handleSubmitNotifications,
    formState: { errors: notificationErrors },
    reset: resetNotifications,
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: user?.settings?.notifications || {
      emailNotifications: true,
      pushNotifications: true,
      reportNotifications: true,
      expenseNotifications: true,
      responseNotifications: true,
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setIsProfileLoading(true);
      const response = await api.put(`/users/profile`, data);
      updateUser(response.data.data);
      showNotification('Профайл амжилттай шинэчлэгдлээ', 'success');
      resetProfile(data);
    } catch (error: any) {
      showNotification(error.message || 'Шинэчлэхэд алдаа гарлаа', 'error');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setIsPasswordLoading(true);
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      showNotification('Нууц үг амжилттай шинэчлэгдлээ', 'success');
      resetPassword();
    } catch (error: any) {
      showNotification(error.message || 'Нууц үг солиход алдаа гарлаа', 'error');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const onNotificationsSubmit = async (data: NotificationFormData) => {
    try {
      setIsNotificationsLoading(true);
      const response = await api.put('/users/profile/settings', {
        notifications: data,
      });
      updateUser(response.data.data);
      showNotification('Мэдэгдлийн тохиргоо амжилттай шинэчлэгдлээ', 'success');
    } catch (error: any) {
      showNotification(error.message || 'Шинэчлэхэд алдаа гарлаа', 'error');
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Профайл', icon: '👤' },
    { id: 'password', label: 'Нууц үг', icon: '🔒' },
    { id: 'notifications', label: 'Мэдэгдэл', icon: '🔔' },
    { id: 'preferences', label: 'Тохиргоо', icon: '⚙️' },
    { id: 'security', label: 'Аюулгүй байдал', icon: '🛡️' },
    { id: 'api', label: 'API', icon: '🔑' },
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Хувийн мэдээлэл</h3>
        <form onSubmit={handleSubmitProfile(onProfileSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Овог"
              {...registerProfile('firstName')}
              error={profileErrors.firstName?.message}
              required
            />
            <Input
              label="Нэр"
              {...registerProfile('lastName')}
              error={profileErrors.lastName?.message}
              required
            />
            <Input
              label="И-мэйл хаяг"
              type="email"
              {...registerProfile('email')}
              error={profileErrors.email?.message}
              required
            />
            <Input
              label="Утасны дугаар"
              {...registerProfile('phone')}
              error={profileErrors.phone?.message}
            />
          </div>
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={isProfileLoading}
            >
              {isProfileLoading ? <Loading size="sm" /> : 'Хадгалах'}
            </Button>
          </div>
        </form>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Профайл зураг</h3>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <button className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg">
              📷
            </button>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              JPG, PNG эсвэл GIF форматын зураг оруулна уу. Хамгийн ихдээ 2MB.
            </p>
            <div className="flex space-x-3">
              <Button size="sm" variant="outline">
                Зураг сонгох
              </Button>
              <Button size="sm" variant="danger" disabled={!user?.profileImage}>
                Зураг устгах
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPasswordTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Нууц үг солих</h3>
        <form onSubmit={handleSubmitPassword(onPasswordSubmit)}>
          <div className="space-y-4">
            <Input
              label="Одоогийн нууц үг"
              type="password"
              {...registerPassword('currentPassword')}
              error={passwordErrors.currentPassword?.message}
              required
            />
            <Input
              label="Шинэ нууц үг"
              type="password"
              {...registerPassword('newPassword')}
              error={passwordErrors.newPassword?.message}
              required
              helperText="Дор хаяж 8 тэмдэгт, том, жижиг үсэг, тоо, тусгай тэмдэгт агуулсан байх"
            />
            <Input
              label="Шинэ нууц үг давтах"
              type="password"
              {...registerPassword('confirmPassword')}
              error={passwordErrors.confirmPassword?.message}
              required
            />
          </div>
          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={isPasswordLoading}
            >
              {isPasswordLoading ? <Loading size="sm" /> : 'Нууц үг солих'}
            </Button>
          </div>
        </form>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Нууц үгийн чанар</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-8">✓</div>
            <span className="text-sm">Дор хаяж 8 тэмдэгт</span>
          </div>
          <div className="flex items-center">
            <div className="w-8">✓</div>
            <span className="text-sm">Том, жижиг үсэг</span>
          </div>
          <div className="flex items-center">
            <div className="w-8">✓</div>
            <span className="text-sm">Дор хаяж 1 тоо</span>
          </div>
          <div className="flex items-center">
            <div className="w-8">✓</div>
            <span className="text-sm">Дор хаяж 1 тусгай тэмдэгт</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Мэдэгдлийн тохиргоо</h3>
        <form onSubmit={handleSubmitNotifications(onNotificationsSubmit)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">И-мэйл мэдэгдэл</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Системийн мэдэгдлийг и-мэйлээр хүлээн авах
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  {...registerNotifications('emailNotifications')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Пуш мэдэгдэл</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Веб пуш мэдэгдэл хүлээн авах
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  {...registerNotifications('pushNotifications')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Тайлангийн мэдэгдэл</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Тайлан бэлэн болсон мэдэгдэл
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  {...registerNotifications('reportNotifications')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Зардлын мэдэгдэл</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Зардал баталгаажсан, татгалзсан мэдэгдэл
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  {...registerNotifications('expenseNotifications')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Хариултын мэдэгдэл</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Асуулгын хариулт ирсэн мэдэгдэл
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  {...registerNotifications('responseNotifications')}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              type="submit"
              disabled={isNotificationsLoading}
            >
              {isNotificationsLoading ? <Loading size="sm" /> : 'Хадгалах'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Хэл, цаг хугацаа</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Хэл</label>
            <select className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option>Монгол хэл</option>
              <option>Англи хэл</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Цагийн бүс</label>
            <select className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option>Улаанбаатар (UTC+8)</option>
              <option>Гринвич (UTC+0)</option>
              <option>Токио (UTC+9)</option>
              <option>Нью Йорк (UTC-5)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Огнооны формат</label>
            <select className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option>YYYY-MM-DD</option>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Мөнгөн тэмдэгт</label>
            <select className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option>MNT - ₮</option>
              <option>USD - $</option>
              <option>EUR - €</option>
              <option>JPY - ¥</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Харагдац</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Гарчигны хэмжээ</label>
            <select className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option>Жижиг</option>
              <option>Дунд</option>
              <option>Том</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Хүснэгтийн нягтрал</label>
            <select className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-700">
              <option>Нягт</option>
              <option>Ердийн</option>
              <option>Сул</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Нэвтрэх түүх</h3>
        <div className="space-y-3">
          {[
            { device: 'Chrome, Windows', location: 'Улаанбаатар, Монгол', time: '5 минутын өмнө', ip: '192.168.1.1' },
            { device: 'Safari, iOS', location: 'Сөүл, Солонгос', time: '2 цагийн өмнө', ip: '203.0.113.1' },
            { device: 'Firefox, Linux', location: 'Токио, Япон', time: '1 өдрийн өмнө', ip: '198.51.100.1' },
          ].map((session, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{session.device}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {session.location} • {session.ip}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm">{session.time}</div>
                <button className="text-sm text-red-600 hover:text-red-800">
                  Гарах
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" className="mt-4">
          Бүх төхөөрөмжөөс гарах
        </Button>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Хоёр хүчин зүйлээр нэвтрэх</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">И-мэйл баталгаажуулалт</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Нэвтрэх бүрт и-мэйлээр баталгаажуулах код илгээх
            </div>
          </div>
          <Button variant="outline" size="sm">
            Идэвхжүүлэх
          </Button>
        </div>
      </div>
    </div>
  );

  const renderApiTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">API Түлхүүр</h3>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
              sk_live_•••••••••••••••••••••••
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                Хуулах
              </Button>
              <Button size="sm" variant="danger">
                Шинэчлэх
              </Button>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Сүүлд ашиглагдсан: 2 минутын өмнө • Хүчинтэй: 90 хоног
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">API Хязгаарлалт</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Өдрийн хязгаар:</span>
            <span className="font-medium">10,000 хүсэлт</span>
          </div>
          <div className="flex justify-between">
            <span>Минутын хязгаар:</span>
            <span className="font-medium">100 хүсэлт</span>
          </div>
          <div className="flex justify-between">
            <span>Өнөөдрийн үлдсэн:</span>
            <span className="font-medium text-green-600">9,847 хүсэлт</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'password':
        return renderPasswordTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'preferences':
        return renderPreferencesTab();
      case 'security':
        return renderSecurityTab();
      case 'api':
        return renderApiTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Тохиргоо</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Хувийн болон системийн тохиргоо
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <Card className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>

          {/* User Info */}
          <Card className="p-4 mt-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div>
                <div className="font-medium">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Сүүлд нэвтэрсэн: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('mn-MN') : 'Хэзээ ч нэвтрээгүй'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Гишүүнчлэл: {user?.role === 'admin' ? 'Админ' : 'Хэрэглэгч'}
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card className="p-6">
            {renderActiveTab()}
          </Card>

          {/* Danger Zone */}
          {activeTab === 'profile' && (
            <Card className="p-6 mt-6 border-red-200 dark:border-red-800">
              <h3 className="text-lg font-medium text-red-700 dark:text-red-300 mb-4">
                Аюулгүй бүс
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Бүртгэл устгах</div>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Бүх өгөгдөл, түүх, файлууд устгагдана. Энэ үйлдлийг буцаах боломжгүй.
                    </div>
                  </div>
                  <Button variant="danger">
                    Бүртгэл устгах
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Бүх өгөгдөл устгах</div>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Асуулга, зардал, тайлан зэрэг бүх өгөгдөл устгагдана.
                    </div>
                  </div>
                  <Button variant="danger">
                    Өгөгдөл устгах
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;