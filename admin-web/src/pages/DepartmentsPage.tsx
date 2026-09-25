import React, { useEffect, useMemo, useState } from 'react';
import { Building, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { useAuth } from '../contexts/AuthContext';
import { apiErrorMessage } from '../i18n/apiError';
import { peopleService } from '../services/people.service';
import { fiveSLayoutService } from '../services/fiveSLayout.service';
import { Department, memberName, TeamUser } from '../types/people.types';
import { FiveSLayoutPlan } from '../types/fiveS.types';

/**
 * The departments an organization is made of.
 *
 * This page used to keep its list in the browser and say so in a notice: the
 * question it was waiting on was not how to store a name but what a department
 * owns. It owns its people and its 5S areas, and both are counted here from
 * the people and the plans rather than typed in — a member count somebody
 * entered by hand is a number that is wrong by the end of the week.
 */
const DepartmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [plans, setPlans] = useState<FiveSLayoutPlan[]>([]);
  const [draft, setDraft] = useState({ name: '', managerId: '', focusArea: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<Department | null>(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      peopleService.getDepartments(),
      peopleService.getMembers(),
      fiveSLayoutService.getPlans(),
    ])
      .then(([loadedDepartments, loadedMembers, loadedPlans]) => {
        if (!active) return;
        setDepartments(loadedDepartments);
        setMembers(loadedMembers);
        setPlans(loadedPlans);
      })
      .catch((loadError) => active && setError(apiErrorMessage(loadError, t)))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [t]);

  /** Areas per department, across every floor the organization has drawn. */
  const zonesByDepartment = useMemo(() => {
    const counts = new Map<string, number>();

    plans.forEach((plan) =>
      plan.zones.forEach((zone) => {
        if (!zone.departmentId) return;
        counts.set(zone.departmentId, (counts.get(zone.departmentId) ?? 0) + 1);
      }),
    );

    return counts;
  }, [plans]);

  const membersOf = (departmentId: string) =>
    members.filter((member) => member.departmentId === departmentId).length;

  const managerOf = (department: Department) => {
    const manager = members.find((member) => member.id === department.managerId);

    return manager ? memberName(manager) : t('departments.noManager');
  };

  const createDepartment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const department = await peopleService.createDepartment({
        name: draft.name.trim(),
        managerId: draft.managerId || undefined,
        focusArea: draft.focusArea.trim() || undefined,
      });

      // Kept in the order the list is read, so a new department appears where
      // somebody will look for it rather than at the top for one render.
      setDepartments((current) =>
        [...current, department].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setDraft({ name: '', managerId: '', focusArea: '' });
      setCreateOpen(false);
    } catch (saveError) {
      setError(apiErrorMessage(saveError, t));
    } finally {
      setSaving(false);
    }
  };

  const confirmRemoval = async () => {
    if (!pendingRemoval) return;

    try {
      await peopleService.deleteDepartment(pendingRemoval.id);
      setDepartments((current) =>
        current.filter((department) => department.id !== pendingRemoval.id),
      );
    } catch (removeError) {
      setError(apiErrorMessage(removeError, t));
    } finally {
      setPendingRemoval(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('departments.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('departments.subtitle')}</p>
        </div>
        {hasPermission('departments:create') && (
          <Button icon={Plus} type="button" onClick={() => setCreateOpen(true)}>
            {t('departments.newDepartment')}
          </Button>
        )}
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t('departments.newDepartment')}>
        <form onSubmit={createDepartment} className="space-y-4">
          <Input
            label={t('departments.name')}
            placeholder={t('departments.name')}
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            required
          />
          {/*
            A manager who exists, rather than a name typed into a box. The post
            can be empty: a department between managers is a real state, and an
            area still has to be audited while it is being filled.
          */}
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            {t('departments.manager')}
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              value={draft.managerId}
              onChange={(event) => setDraft((current) => ({ ...current, managerId: event.target.value }))}
            >
              <option value="">{t('departments.noManager')}</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {memberName(member)}
                </option>
              ))}
            </select>
          </label>
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
            <Button type="submit" disabled={saving || !draft.name.trim()}>
              {t('departments.addDepartment')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(pendingRemoval)}
        title={t('departments.removeTitle')}
        message={t('departments.removeBody', { name: pendingRemoval?.name ?? '' })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />

      {loading ? (
        <Card loading title={t('common.loading')}>
          <div />
        </Card>
      ) : departments.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {departments.map((department) => (
            <Card key={department.id}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-gray-900 dark:text-white">{department.name}</h2>
                {hasPermission('departments:delete') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    type="button"
                    aria-label={t('departments.remove', { name: department.name })}
                    onClick={() => setPendingRemoval(department)}
                  />
                )}
              </div>
              <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  {t('departments.manager')}: {managerOf(department)}
                </div>
                <div>
                  {t('departments.members')}: <span className="tabular-nums">{membersOf(department.id)}</span>
                </div>
                {/*
                  The half that makes a department worth having on a 5S
                  programme: the areas it answers for, counted across every
                  floor rather than only the one somebody happens to be on.
                */}
                <div>
                  {t('departments.zones')}:{' '}
                  <span className="tabular-nums">{zonesByDepartment.get(department.id) ?? 0}</span>
                </div>
                <div>
                  {t('departments.focus')}: {department.focusArea || '-'}
                </div>
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
