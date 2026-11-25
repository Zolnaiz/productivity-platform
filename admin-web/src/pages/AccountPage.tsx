import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Input from '../components/common/Input';
import { useAuth } from '../contexts/AuthContext';
import { changeLanguage } from '../i18n';
import { apiErrorMessage } from '../i18n/apiError';
import { authService } from '../services/auth.service';

/**
 * UC-07: a person's own name, phone, language and password, and (FR-21) the
 * request to have the account deleted. The phone offers the same request in
 * its account menu; the privacy policy (/privacy) points to both.
 */
const AccountPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  // The API builds `name` as "<first> <last>", so it splits back the same way.
  const nameParts = (user?.name ?? '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] ?? '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' '));
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [language, setLanguage] = useState((user?.language || i18n.language || 'mn').slice(0, 2));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmingDeletion, setConfirmingDeletion] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [deletionError, setDeletionError] = useState<string | null>(null);

  const saveDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    setDetailsError(null);
    try {
      await authService.updateOwnProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        language,
      });
      await changeLanguage(language);
      await refreshUser();
      toast.success(t('account.saved'));
    } catch (error) {
      setDetailsError(apiErrorMessage(error, t));
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast.success(t('account.passwordChanged'));
    } catch (error) {
      setPasswordError(apiErrorMessage(error, t));
    }
  };

  // Sent only after the confirmation, and said back differently when no
  // administrator could be told, so nobody waits on a request nobody received.
  const requestDeletion = async () => {
    setDeletionError(null);
    setRequestingDeletion(true);
    try {
      const { administratorsTold } = await authService.requestAccountDeletion();
      setConfirmingDeletion(false);
      if (administratorsTold > 0) toast.success(t('account.deletionSent'));
      else setDeletionError(t('account.deletionNobody'));
    } catch (error) {
      setConfirmingDeletion(false);
      setDeletionError(apiErrorMessage(error, t));
    } finally {
      setRequestingDeletion(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('account.title')}</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('account.subtitle')}</p>
      </div>

      <Card>
        <form onSubmit={saveDetails} className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('account.details')}</h2>
          <Input label={t('account.lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <Input label={t('account.firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label={t('account.phone')} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('account.language')}
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="mn">Монгол</option>
              <option value="en">English</option>
            </select>
          </label>
          {detailsError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {detailsError}
            </p>
          )}
          <Button type="submit">{t('account.save')}</Button>
        </form>
      </Card>

      <Card>
        <form onSubmit={savePassword} className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('account.password')}</h2>
          <Input
            label={t('account.currentPassword')}
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label={t('account.newPassword')}
            type="password"
            autoComplete="new-password"
            helperText={t('auth.passwordHint')}
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {passwordError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {passwordError}
            </p>
          )}
          <Button type="submit">{t('account.changePassword')}</Button>
        </form>
      </Card>

      <Card>
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('account.deletion')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('account.deletionExplain')}</p>
          {deletionError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {deletionError}
            </p>
          )}
          <Button type="button" variant="danger" onClick={() => setConfirmingDeletion(true)}>
            {t('account.deletionRequest')}
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={confirmingDeletion}
        title={t('account.deletion')}
        message={t('account.deletionExplain')}
        confirmLabel={t('account.deletionSend')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={requestingDeletion}
        onConfirm={requestDeletion}
        onCancel={() => setConfirmingDeletion(false)}
      />
    </div>
  );
};

export default AccountPage;
