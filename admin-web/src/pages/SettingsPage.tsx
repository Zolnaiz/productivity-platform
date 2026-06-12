import React, { useEffect, useState } from 'react';
import Card from '../components/common/Card';
import { adminService } from '../services/admin.service';
import { WorkspaceSettings } from '../types/admin.types';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminService.getWorkspaceSettings().then(setSettings);
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

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Report automation, notification rules, and workspace preferences.
        </p>
      </div>

      <Card title="Workspace preferences">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Timezone</span>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={settings.timezone}
              onChange={(event) => updateField('timezone', event.target.value)}
            >
              <option value="Asia/Ulaanbaatar">Asia/Ulaanbaatar</option>
              <option value="UTC">UTC</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Language</span>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={settings.language}
              onChange={(event) => updateField('language', event.target.value)}
            >
              <option value="mn-MN">Mongolian</option>
              <option value="en-US">English</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Month close day</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              max={31}
              min={1}
              type="number"
              value={settings.monthCloseDay}
              onChange={(event) => updateField('monthCloseDay', Number(event.target.value))}
            />
          </label>
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
        <div className="mt-5 flex items-center gap-3">
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" onClick={saveSettings} type="button">
            Save settings
          </button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
