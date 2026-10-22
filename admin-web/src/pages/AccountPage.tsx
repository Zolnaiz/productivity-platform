import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { useAuth } from '../contexts/AuthContext';
import { changeLanguage } from '../i18n';
import { apiErrorMessage } from '../i18n/apiError';
import { authService } from '../services/auth.service';

/** UC-07: a person's own name, phone, language and password. */
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
    </div>
  );
};

export default AccountPage;
