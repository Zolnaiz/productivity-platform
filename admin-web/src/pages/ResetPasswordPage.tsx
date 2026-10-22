import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { authService } from '../services/auth.service';
import { apiErrorMessage } from '../i18n/apiError';

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const { token = '' } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setBusy(true);
    try {
      await authService.resetPassword({ token, password });
      setDone(true);
    } catch (submitError) {
      setError(apiErrorMessage(submitError, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800"
      >
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('auth.resetTitle')}</h1>

        {done ? (
          <p className="mt-6 text-sm text-green-700 dark:text-green-400" role="status">
            {t('auth.resetDone')}
          </p>
        ) : (
          <>
            <div className="mt-6 space-y-4">
              <Input
                label={t('auth.newPassword')}
                type="password"
                autoComplete="new-password"
                helperText={t('auth.passwordHint')}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Input
                label={t('auth.confirmPassword')}
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
            {error && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <Button className="mt-6" fullWidth type="submit" disabled={busy}>
              {t('auth.savePassword')}
            </Button>
          </>
        )}

        <div className="mt-4 text-sm">
          <Link className="text-blue-600 hover:text-blue-500" to="/login">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </form>
    </main>
  );
};

export default ResetPasswordPage;
