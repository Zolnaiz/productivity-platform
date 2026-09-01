import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../contexts/AuthContext';
import { isDemoEnabled } from '../services/api';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState('owner@example.com');
  const [password, setPassword] = useState('Password123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch {
      setError('Нэвтрэхэд алдаа гарлаа. Backend API бэлэн эсэхийг шалгана уу.');
    }
  };

  const handleDemoLogin = () => {
    if (!isDemoEnabled()) return;

    loginDemo();
    navigate('/dashboard');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800"
      >
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Нэвтрэх</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Productivity platform workspace руу нэвтрэх.
        </p>

        <div className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <Button className="mt-6" fullWidth type="submit">
          Нэвтрэх
        </Button>

        {isDemoEnabled() && (
          <Button className="mt-3" fullWidth variant="outline" type="button" onClick={handleDemoLogin}>
            Demo workspace нээх
          </Button>
        )}

        <div className="mt-4 flex justify-between text-sm">
          <Link className="text-blue-600 hover:text-blue-500" to="/forgot-password">
            Нууц үг мартсан
          </Link>
          <Link className="text-blue-600 hover:text-blue-500" to="/register">
            Бүртгүүлэх
          </Link>
        </div>
      </form>
    </main>
  );
};

export default LoginPage;
