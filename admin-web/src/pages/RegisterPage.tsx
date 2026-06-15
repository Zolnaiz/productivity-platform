import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.register({
        name,
        organizationName,
        email,
        phone: phone || undefined,
        password,
      });
      navigate('/login', { replace: true });
    } catch {
      setError('Бүртгэл үүсгэж чадсангүй. Мэдээллээ шалгаад дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800"
      >
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Бүртгүүлэх</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Байгууллагын workspace болон эхний admin хэрэглэгчийг үүсгэнэ.
        </p>

        <label className="mt-6 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Таны нэр
          <input
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Байгууллагын нэр
          <input
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            required
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
          <input
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Утас
          <input
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
          <input
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? 'Бүртгэж байна...' : 'Workspace үүсгэх'}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Бүртгэлтэй юу?{' '}
          <Link className="text-blue-600 hover:text-blue-500" to="/login">
            Нэвтрэх
          </Link>
        </p>
      </form>
    </main>
  );
};

export default RegisterPage;
