import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
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

        <div className="mt-6 space-y-4">
          <Input
            label="Таны нэр"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <Input
            label="Байгууллагын нэр"
            autoComplete="organization"
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
            required
          />

          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <Input
            label="Утас"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            helperText="Дор хаяж 6 тэмдэгт"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <Button className="mt-6" fullWidth type="submit" loading={loading} disabled={loading}>
          {loading ? 'Бүртгэж байна...' : 'Workspace үүсгэх'}
        </Button>

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
