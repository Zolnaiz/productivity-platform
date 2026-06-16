import React, { useEffect, useState } from 'react';
import Card from '../components/common/Card';
import { adminService } from '../services/admin.service';
import { WorkspaceProfile } from '../types/admin.types';

const OrganizationsPage: React.FC = () => {
  const [profile, setProfile] = useState<WorkspaceProfile | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getWorkspaceProfile().then(setProfile).finally(() => setLoading(false));
  }, []);

  const updateField = (field: keyof WorkspaceProfile, value: string | number) => {
    setProfile((current) => (current ? { ...current, [field]: value } : current));
    setSaved(false);
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    const updated = await adminService.updateWorkspaceProfile(profile);
    setProfile(updated);
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Organizations</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Workspace profile, industry, contact, and company scale for reports and templates.
        </p>
      </div>

      {loading || !profile ? (
        <Card loading title="Loading workspace profile">
          <div />
        </Card>
      ) : (
        <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">Plan</div>
          <div className="mt-2 text-2xl font-semibold capitalize text-gray-900 dark:text-white">{profile.plan}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Employees</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{profile.employeeCount}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Industry</div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{profile.industry}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Workspace ID</div>
          <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{profile.id}</div>
        </Card>
      </div>

      <Card title="Workspace profile" subtitle="Used by dashboards, report headers, and audit template suggestions.">
        <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Organization name</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={profile.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Industry</span>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={profile.industry}
              onChange={(event) => updateField('industry', event.target.value)}
            >
              <option>Manufacturing / Operations</option>
              <option>Construction</option>
              <option>Hospitality</option>
              <option>Retail</option>
              <option>Logistics</option>
              <option>Facility management</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Contact email</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={profile.contactEmail}
              onChange={(event) => updateField('contactEmail', event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Contact phone</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={profile.contactPhone}
              onChange={(event) => updateField('contactPhone', event.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Employee count</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              min={1}
              type="number"
              value={profile.employeeCount}
              onChange={(event) => updateField('employeeCount', Number(event.target.value))}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Address</span>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              value={profile.address}
              onChange={(event) => updateField('address', event.target.value)}
            />
          </label>
          <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" type="submit">
              Save workspace
            </button>
            {saved && <span className="text-sm text-green-600">Saved</span>}
          </div>
        </form>
      </Card>
        </>
      )}
    </div>
  );
};

export default OrganizationsPage;
