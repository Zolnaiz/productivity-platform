import React, { useEffect, useState } from 'react';
import Card from '../components/common/Card';
import { peopleService } from '../services/people.service';
import { Department } from '../types/people.types';

const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [draft, setDraft] = useState({ name: '', manager: '', focusArea: '' });

  useEffect(() => {
    peopleService.getDepartments().then(setDepartments);
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Departments</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Байгууллагын хэлтэс, manager, focus area, багийн бүтэц.
        </p>
      </div>

      <Card title="New department">
        <form onSubmit={createDepartment} className="grid gap-3 lg:grid-cols-4">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Department name"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Manager"
            value={draft.manager}
            onChange={(event) => setDraft((current) => ({ ...current, manager: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Focus area"
            value={draft.focusArea}
            onChange={(event) => setDraft((current) => ({ ...current, focusArea: event.target.value }))}
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
            Add department
          </button>
        </form>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {departments.map((department) => (
          <Card key={department.id}>
            <h2 className="font-semibold text-gray-900 dark:text-white">{department.name}</h2>
            <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div>Manager: {department.manager || '-'}</div>
              <div>Members: {department.memberCount}</div>
              <div>Focus: {department.focusArea || '-'}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DepartmentsPage;
