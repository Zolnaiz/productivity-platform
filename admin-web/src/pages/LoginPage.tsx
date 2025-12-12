import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';

const loginSchema = z.object({
  email: z.string().email('И-мэйл хаяг буруу байна'),
  password: z.string().min(6, 'Нууц үг дор хаяж 6 тэмдэгт байх ёстой'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password);
      showNotification('Амжилттай нэвтэрлээ', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      showNotification(error.message || 'Нэвтрэхэд алдаа гарлаа', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <img
              className="h-12 w-auto"
              src="/logo.svg"
              alt="Questionnaire System"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Системд нэвтрэх
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Өөрийн бүртгэлээр нэвтрэнэ үү
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="И-мэйл хаяг"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="name@example.com"
              required
              autoComplete="email"
            />
            <Input
              label="Нууц үг"
              type="password"
              {...register('password')}
              error={errors.password?.message}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
              >
                Намайг сана
              </label>
            </div>

            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-primary hover:text-primary-dark"
              >
                Нууц үгээ мартсан уу?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? <Loading size="sm" /> : 'Нэвтрэх'}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Бүртгэлгүй юу?{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:text-primary-dark"
            >
              Бүртгүүлэх
            </Link>
          </p>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Эсвэл үргэлжлүүлэх
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => showNotification('Уучлаарай, энэ функц хөгжүүлэгдэж байна', 'info')}
            >
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => showNotification('Уучлаарай, энэ функц хөгжүүлэгдэж байна', 'info')}
            >
              Facebook
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;