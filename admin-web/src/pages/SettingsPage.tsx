import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { applyWorkspaceLanguage, changeLanguage } from '../i18n';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import AttachmentCheck from '../components/settings/AttachmentCheck';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/admin.service';
import { WorkspaceSettings } from '../types/admin.types';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getWorkspaceSettings()
      .then((workspaceSettings) => {
        setSettings(workspaceSettings);
        // A browser that has never chosen a language still follows the
        // workspace's own setting. Applied, not chosen: opening this page used
        // to store the workspace's language as the reader's own choice.
        applyWorkspaceLanguage(workspaceSettings.language);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateField = <T extends keyof WorkspaceSettings>(field: T, value: WorkspaceSettings[T]) => {
    setSettings((current) => (current ? { ...current, [field]: value } : current));
    setSaved(false);

    // Apply the language immediately: the control claimed to change the
    // language long before anything was actually translated.
    if (field === 'language') void changeLanguage(String(value));
  };

  const saveSettings = async () => {
    if (!settings) return;
    const updated = await adminService.updateWorkspaceSettings(settings);
    setSettings(updated);
    applyWorkspaceLanguage(updated.language);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('settings.subtitle')}</p>
      </div>

      {loading || !settings ? (
        <Card loading title={t('common.loading')}>
          <div />
        </Card>
      ) : (
        <>
      <Card title={t('settings.workspacePreferences')}>
        <div className="grid gap-4 md:grid-cols-3">
          <Select
            label={t('settings.timezone')}
            helperText={t('settings.timezoneHint')}
            value={settings.timezone}
            onChange={(event) => updateField('timezone', event.target.value)}
          >
            <option value="Asia/Ulaanbaatar">Asia/Ulaanbaatar</option>
            <option value="UTC">UTC</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </Select>
          <Select
            label={t('settings.language')}
            helperText={t('settings.languageHint')}
            value={settings.language}
            onChange={(event) => updateField('language', event.target.value)}
          >
            {/* Each language names itself, so it is readable whichever is active. */}
            <option value="mn-MN">Монгол</option>
            <option value="en-US">English</option>
          </Select>
          <Input
            label={t('settings.monthCloseDay')}
            helperText={t('settings.monthCloseDayHint')}
            // Up to the 28th, the last day every month has; the server reads
            // anything else as the default.
            max={28}
            min={1}
            type="number"
            value={settings.monthCloseDay}
            onChange={(event) => updateField('monthCloseDay', Number(event.target.value))}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={saveSettings} type="button">
            {t('settings.saveSettings')}
          </Button>
          {saved && <span className="text-sm text-green-600">{t('settings.saved')}</span>}
        </div>
      </Card>

      {hasPermission('attachments:check') && <AttachmentCheck />}

      {/*
        Four switches stood here — automatic monthly reports, notify on overdue
        tasks, notify on a low audit score, require approval for work logs —
        and nothing read any of them. A switch labelled "notify managers" that
        notifies nobody misleads the person setting the system up, and storing
        it in a database would only have made it more convincing. They come
        back when notifications do; the roadmap carries them.
      */}
        </>
      )}
    </div>
  );
};

export default SettingsPage;
