import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import KpiCard from '../components/widgets/KpiCard';
import { assessmentService } from '../services/assessment.service';
import { operationsService } from '../services/operations.service';
import { peopleService } from '../services/people.service';
import { AssessmentResponse } from '../types/assessment.types';
import { OperationsSummary, Project, WorkTask } from '../types/operations.types';
import { Department, TeamUser } from '../types/people.types';

const AnalyticsPage: React.FC = () => {
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
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Productivity, project progress, task completion, assessment scores, and department workload.
        </p>
      </div>

      {loading || !summary ? (
        <Card loading title="Loading analytics">
          <div />
        </Card>
      ) : (
        <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Task completion" value={`${summary.kpis.taskCompletionRate}%`} description={`${summary.totals.completedTasks}/${summary.totals.tasks} tasks done`} />
        <KpiCard title="Project progress" value={`${summary.kpis.averageProjectProgress}%`} description={`${projects.length} projects tracked`} />
        <KpiCard title="Assessment score" value={`${responseAverage}%`} description={`${responses.length} questionnaire responses`} />
        <KpiCard title="Logged hours" value={summary.totals.totalHours} description="Total demo time entries" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Project progress">
          <div className="space-y-4">
            {projects.length ? (
              projects.map((project) => (
                <div key={project.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{project.name}</span>
                    <span className="text-gray-500">{project.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-900">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No project data yet"
                description="Project progress analytics will appear after projects are created."
              />
            )}
          </div>
        </Card>

        <Card title="Task status mix">
          <div className="space-y-3">
            {['backlog', 'todo', 'in_progress', 'review', 'done'].map((status) => {
              const count = tasks.filter((task) => task.status === status).length;
              const width = tasks.length ? Math.round((count / tasks.length) * 100) : 0;
              return (
                <div key={status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize text-gray-700 dark:text-gray-300">{status.replace('_', ' ')}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-900">
                    <div className="h-2 rounded-full bg-green-600" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Department performance">
        {departmentRows.length ? (
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b text-gray-500 dark:border-gray-700">
              <tr>
                <th className="py-3">Department</th>
                <th className="py-3">Members</th>
                <th className="py-3">Responses</th>
                <th className="py-3">Assessment score</th>
                <th className="py-3">Focus area</th>
              </tr>
            </thead>
            <tbody>
              {departmentRows.map((row) => (
                <tr key={row.department.id} className="border-b dark:border-gray-700">
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{row.department.name}</td>
                  <td className="py-3">{row.members}</td>
                  <td className="py-3">{row.responses}</td>
                  <td className="py-3">{row.score ? `${row.score}%` : '-'}</td>
                  <td className="py-3 text-gray-500">{row.department.focusArea}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <EmptyState
            icon={BarChart3}
            title="No department analytics yet"
            description="Department performance will appear after departments and users are configured."
          />
        )}
      </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
