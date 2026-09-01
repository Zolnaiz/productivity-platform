import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HorizontalBarChart from '../components/charts/HorizontalBarChart';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Table from '../components/common/Table';
import KpiCard from '../components/widgets/KpiCard';
import { assessmentService } from '../services/assessment.service';
import { operationsService } from '../services/operations.service';
import { peopleService } from '../services/people.service';
import { AssessmentResponse } from '../types/assessment.types';
import { OperationsSummary, Project, WorkTask } from '../types/operations.types';
import { Department, TeamUser } from '../types/people.types';

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [responses, setResponses] = useState<AssessmentResponse[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      operationsService.getSummary(),
      operationsService.getProjects(),
      operationsService.getTasks(),
      assessmentService.getResponses(),
      peopleService.getUsers(),
      peopleService.getDepartments(),
    ]).then(([operationsSummary, projectItems, taskItems, responseItems, userItems, departmentItems]) => {
      setSummary(operationsSummary);
      setProjects(projectItems);
      setTasks(taskItems);
      setResponses(responseItems);
      setUsers(userItems);
      setDepartments(departmentItems);
    }).finally(() => setLoading(false));
  }, []);

  const responseAverage = responses.length
    ? Math.round(responses.reduce((sum, response) => sum + response.score, 0) / responses.length)
    : 0;

  const projectProgress = useMemo(
    () => projects.map((project) => ({ label: project.name, value: project.progress })),
    [projects],
  );

  // Ordered pipeline stages, so the ordinal ramp reads as progression.
  const taskStatusMix = useMemo(() => {
    const stages: Array<{ key: WorkTask['status']; label: string }> = [
      { key: 'backlog', label: t('tasks.status.backlog') },
      { key: 'todo', label: t('tasks.status.todo') },
      { key: 'in_progress', label: t('tasks.status.inProgress') },
      { key: 'review', label: t('tasks.status.review') },
      { key: 'done', label: t('tasks.status.done') },
    ];

    return stages.map((stage) => ({
      label: stage.label,
      value: tasks.filter((task) => task.status === stage.key).length,
    }));
    // `t` belongs here: without it the stage labels keep the previous language
    // after a switch.
  }, [tasks, t]);

  const departmentRows = useMemo(
    () =>
      departments.map((department) => {
        const members = users.filter((user) => user.departmentId === department.id);
        const departmentResponses = responses.filter((response) => response.department === department.name);
        const score = departmentResponses.length
          ? Math.round(departmentResponses.reduce((sum, response) => sum + response.score, 0) / departmentResponses.length)
          : 0;

        return {
          department,
          members: members.length,
          responses: departmentResponses.length,
          score,
        };
      }),
    [departments, responses, users],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('analytics.title')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('analytics.subtitle')}</p>
      </div>

      {loading || !summary ? (
        <Card loading title={t('common.loading')}>
          <div />
        </Card>
      ) : (
        <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title={t('analytics.taskCompletion')} value={`${summary.kpis.taskCompletionRate}%`} description={t('analytics.tasksDone', { done: summary.totals.completedTasks, total: summary.totals.tasks })} />
        <KpiCard title={t('analytics.projectProgress')} value={`${summary.kpis.averageProjectProgress}%`} description={t('analytics.projectsTracked', { count: projects.length })} />
        <KpiCard title={t('analytics.assessmentScore')} value={`${responseAverage}%`} description={t('analytics.questionnaireResponses', { count: responses.length })} />
        <KpiCard title={t('analytics.loggedHours')} value={summary.totals.totalHours} description={t('analytics.totalTimeEntries')} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={t('analytics.projectProgress')} subtitle={t('analytics.projectProgressSubtitle')}>
          {projectProgress.length ? (
            <HorizontalBarChart data={projectProgress} unit="%" maxValue={100} />
          ) : (
            <EmptyState
              icon={BarChart3}
              title={t('analytics.noProjectsTitle')}
              description={t('analytics.noProjectsDescription')}
            />
          )}
        </Card>

        <Card title={t('analytics.taskStatusMix')} subtitle={t('analytics.taskStatusSubtitle')}>
          {tasks.length ? (
            <HorizontalBarChart data={taskStatusMix} colorMode="ordinal" labelWidth={110} allowDecimals={false} />
          ) : (
            <EmptyState
              icon={BarChart3}
              title={t('analytics.noTasksTitle')}
              description={t('analytics.noTasksDescription')}
            />
          )}
        </Card>
      </div>

      <Card title={t('analytics.departmentPerformance')}>
        <Table
          rows={departmentRows}
          rowKey={(row) => row.department.id}
          columns={[
            {
              key: 'name',
              header: t('analytics.department'),
              className: 'py-3 font-medium text-gray-900 dark:text-white',
              render: (row) => row.department.name,
            },
            { key: 'members', header: t('analytics.members'), render: (row) => row.members },
            { key: 'responses', header: t('analytics.responses'), render: (row) => row.responses },
            {
              key: 'score',
              header: t('analytics.assessmentScore'),
              render: (row) => (row.responses ? `${row.score}%` : '-'),
            },
            {
              key: 'focus',
              header: t('analytics.focusArea'),
              className: 'py-3 text-gray-500',
              render: (row) => row.department.focusArea || '-',
            },
          ]}
          empty={
            <EmptyState
              icon={BarChart3}
              title={t('analytics.noDepartmentsTitle')}
              description={t('analytics.noDepartmentsDescription')}
            />
          }
        />
      </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
