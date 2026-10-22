import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { authService } from '../services/auth.service';
import { apiErrorMessage } from '../i18n/apiError';

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await authService.forgotPassword(email.trim());
      // The same sentence whether or not the address is registered.
      setSent(true);
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('auth.forgotTitle')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('auth.forgotHint')}</p>

        {sent ? (
          <p className="mt-6 text-sm text-green-700 dark:text-green-400" role="status">
            {t('auth.forgotSent')}
          </p>
        ) : (
          <>
            <div className="mt-6">
              <Input
                label={t('auth.email')}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {error && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <Button className="mt-6" fullWidth type="submit" disabled={busy || !email.trim()}>
              {busy ? t('auth.sending') : t('auth.sendLink')}
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

export default ForgotPasswordPage;
