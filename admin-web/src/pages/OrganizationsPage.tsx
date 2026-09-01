import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { adminService } from '../services/admin.service';
import { WorkspaceProfile } from '../types/admin.types';

const OrganizationsPage: React.FC = () => {
  const { t } = useTranslation();
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('organizations.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('organizations.subtitle')}</p>
      </div>

      {loading || !profile ? (
        <Card loading title={t('common.loading')}>
          <div />
        </Card>
      ) : (
        <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">{t('organizations.plan')}</div>
          <div className="mt-2 text-2xl font-semibold capitalize text-gray-900 dark:text-white">{profile.plan}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('organizations.employees')}</div>
          <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{profile.employeeCount}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('organizations.industry')}</div>
          <div className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{profile.industry}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">{t('organizations.workspaceId')}</div>
          <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{profile.id}</div>
        </Card>
      </div>

      <Card title={t('organizations.workspaceProfile')} subtitle={t('organizations.workspaceProfileSubtitle')}>
        <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
          <Input
            label={t('organizations.organizationName')}
            value={profile.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
          <Select
            label={t('organizations.industry')}
            value={profile.industry}
            onChange={(event) => updateField('industry', event.target.value)}
          >
            <option>Manufacturing / Operations</option>
            <option>Construction</option>
            <option>Hospitality</option>
            <option>Retail</option>
            <option>Logistics</option>
            <option>Facility management</option>
          </Select>
          <Input
            label={t('organizations.contactEmail')}
            type="email"
            value={profile.contactEmail}
            onChange={(event) => updateField('contactEmail', event.target.value)}
          />
          <Input
            label={t('organizations.contactPhone')}
            type="tel"
            value={profile.contactPhone}
            onChange={(event) => updateField('contactPhone', event.target.value)}
          />
          <Input
            label={t('organizations.employeeCount')}
            min={1}
            type="number"
            value={profile.employeeCount}
            onChange={(event) => updateField('employeeCount', Number(event.target.value))}
          />
          <Input
            label={t('organizations.address')}
            value={profile.address}
            onChange={(event) => updateField('address', event.target.value)}
          />
          <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center">
            <Button type="submit">{t('organizations.saveWorkspace')}</Button>
            {saved && <span className="text-sm text-green-600">{t('organizations.saved')}</span>}
          </div>
        </form>
      </Card>
        </>
      )}
    </div>
  );
};

export default OrganizationsPage;
