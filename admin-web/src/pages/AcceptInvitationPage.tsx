import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { authService } from '../services/auth.service';
import { apiErrorMessage } from '../i18n/apiError';

/** Where the link in an invitation email lands: the invitee names themselves and sets a password. */
const AcceptInvitationPage: React.FC = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : t('auth.inviteMissing'));

  useEffect(() => {
    if (!token) return;
    authService
      .previewInvitation(token)
      .then((invitation) => setEmail(invitation.email))
      .catch((previewError) => setError(apiErrorMessage(previewError, t)));
  }, [token, t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      await authService.acceptInvitation(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      });
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('auth.inviteTitle')}</h1>
        {email && !done && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('auth.inviteHint', { email })}</p>
        )}

        {done ? (
          <p className="mt-6 text-sm text-green-700 dark:text-green-400" role="status">
            {t('auth.inviteDone')}
          </p>
        ) : (
          <>
            {error && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            {email && (
              <>
                <div className="mt-6 space-y-4">
                  <Input
                    label={t('auth.lastName')}
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                  <Input
                    label={t('auth.firstName')}
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                  <Input
                    label={t('auth.password')}
                    type="password"
                    autoComplete="new-password"
                    helperText={t('auth.passwordHint')}
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
                <Button className="mt-6" fullWidth type="submit" disabled={busy}>
                  {t('auth.acceptInvite')}
                </Button>
              </>
            )}
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

export default AcceptInvitationPage;
