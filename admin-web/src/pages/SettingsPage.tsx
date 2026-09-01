import React, { useEffect, useState } from 'react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { adminService } from '../services/admin.service';
import { WorkspaceSettings } from '../types/admin.types';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getWorkspaceSettings().then(setSettings).finally(() => setLoading(false));
  }, []);

  const updateField = <T extends keyof WorkspaceSettings>(field: T, value: WorkspaceSettings[T]) => {
    setSettings((current) => (current ? { ...current, [field]: value } : current));
    setSaved(false);
  };

  const saveSettings = async () => {
    if (!settings) return;
    const updated = await adminService.updateWorkspaceSettings(settings);
    setSettings(updated);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Report automation, notification rules, and workspace preferences.
        </p>
      </div>

      {loading || !settings ? (
        <Card loading title="Loading workspace settings">
          <div />
        </Card>
      ) : (
        <>
      <Card title="Workspace preferences">
        <div className="grid gap-4 md:grid-cols-3">
          <Select
            label="Timezone"
            value={settings.timezone}
            onChange={(event) => updateField('timezone', event.target.value)}
          >
            <option value="Asia/Ulaanbaatar">Asia/Ulaanbaatar</option>
            <option value="UTC">UTC</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </Select>
          <Select
            label="Language"
            value={settings.language}
            onChange={(event) => updateField('language', event.target.value)}
          >
            <option value="mn-MN">Mongolian</option>
            <option value="en-US">English</option>
          </Select>
          <Input
            label="Month close day"
            max={31}
            min={1}
            type="number"
            value={settings.monthCloseDay}
            onChange={(event) => updateField('monthCloseDay', Number(event.target.value))}
          />
        </div>
      </Card>

      <Card title="Automation rules">
        <div className="space-y-4">
          {[
            ['autoMonthlyReport', 'Automatically prepare monthly employee and project reports'],
            ['notifyOverdueTasks', 'Notify managers about overdue tasks'],
            ['notifyLowAuditScore', 'Notify quality team when audit score is below 85%'],
            ['requireWorkLogApproval', 'Require manager approval for employee work logs'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
              <input
                checked={Boolean(settings[key as keyof WorkspaceSettings])}
                className="h-5 w-5"
                type="checkbox"
                onChange={(event) => updateField(key as keyof WorkspaceSettings, event.target.checked as never)}
              />
            </label>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={saveSettings} type="button">
            Save settings
          </Button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </Card>
        </>
      )}
    </div>
  );
};

export default SettingsPage;
