import React, { useEffect, useMemo, useState } from 'react';
import Card from '../components/common/Card';
import { productivityService } from '../services/productivity.service';
import { DailyGoal } from '../types/productivity.types';

const today = () => new Date().toISOString().slice(0, 10);

const DailyGoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    productivityService.getGoals().then(setGoals);
  }, []);

  const stats = useMemo(() => {
    const todayGoals = goals.filter((goal) => goal.date === today());
    const completed = todayGoals.filter((goal) => goal.completed).length;
    return {
      todayGoals,
      completed,
      rate: todayGoals.length ? Math.round((completed / todayGoals.length) * 100) : 0,
    };
  }, [goals]);

  const createGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    const goal = await productivityService.createGoal({ title, date: today(), completed: false });
    setGoals((current) => [goal, ...current]);
    setTitle('');
  };

  const toggleGoal = async (goal: DailyGoal) => {
    const updated = await productivityService.updateGoal(goal.id, { completed: !goal.completed });
    setGoals((current) => current.map((item) => (item.id === goal.id ? updated : item)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Daily Goals</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Өдрийн зорилгоо бүртгэж, биелэлтээ сарын тайланд оруулах суурь дата үүсгэнэ.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm text-gray-500">Today goals</div>
          <div className="mt-2 text-3xl font-semibold">{stats.todayGoals.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Completed</div>
          <div className="mt-2 text-3xl font-semibold">{stats.completed}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Completion rate</div>
          <div className="mt-2 text-3xl font-semibold">{stats.rate}%</div>
        </Card>
      </div>

      <Card title="New goal">
        <form onSubmit={createGoal} className="flex gap-3">
          <input
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Goal title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
            Add goal
          </button>
        </form>
      </Card>

      <Card title="Today">
        <div className="space-y-3">
          {stats.todayGoals.map((goal) => (
            <label key={goal.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <input type="checkbox" checked={goal.completed} onChange={() => toggleGoal(goal)} />
              <span className={goal.completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}>
                {goal.title}
              </span>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DailyGoalsPage;
