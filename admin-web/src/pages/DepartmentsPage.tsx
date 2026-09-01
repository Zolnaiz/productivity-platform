import React, { useEffect, useState } from 'react';
import { Building, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { peopleService } from '../services/people.service';
import { Department } from '../types/people.types';

const DepartmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [draft, setDraft] = useState({ name: '', manager: '', focusArea: '' });
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    peopleService.getDepartments().then(setDepartments).finally(() => setLoading(false));
  }, []);

  const createDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    const department = await peopleService.createDepartment({
      ...draft,
      memberCount: 0,
    });
    setDepartments((current) => [department, ...current]);
    setDraft({ name: '', manager: '', focusArea: '' });
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('departments.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('departments.subtitle')}</p>
        </div>
        <Button icon={Plus} type="button" onClick={() => setCreateOpen(true)}>
          {t('departments.newDepartment')}
        </Button>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t('departments.newDepartment')}>
        <form onSubmit={createDepartment} className="space-y-4">
          <Input
            label={t('departments.name')}
            placeholder={t('departments.name')}
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            required
          />
          <Input
            label={t('departments.manager')}
            placeholder={t('departments.manager')}
            value={draft.manager}
            onChange={(event) => setDraft((current) => ({ ...current, manager: event.target.value }))}
          />
          <Input
            label={t('departments.focusArea')}
            placeholder={t('departments.focusArea')}
            value={draft.focusArea}
            onChange={(event) => setDraft((current) => ({ ...current, focusArea: event.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('departments.addDepartment')}</Button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <Card loading title={t('common.loading')}>
          <div />
        </Card>
      ) : departments.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {departments.map((department) => (
            <Card key={department.id}>
              <h2 className="font-semibold text-gray-900 dark:text-white">{department.name}</h2>
              <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>{t('departments.manager')}: {department.manager || '-'}</div>
                <div>{t('departments.members')}: {department.memberCount}</div>
                <div>{t('departments.focus')}: {department.focusArea || '-'}</div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building}
          title={t('departments.emptyTitle')}
          description={t('departments.emptyDescription')}
        />
      )}
    </div>
  );
};

export default DepartmentsPage;
