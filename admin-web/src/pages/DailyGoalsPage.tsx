import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Circle, Plus, Target } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import { productivityService } from '../services/productivity.service';
import { DailyGoal } from '../types/productivity.types';

const today = () => new Date().toISOString().slice(0, 10);

const DailyGoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [title, setTitle] = useState('');
  const [goalDate, setGoalDate] = useState(today());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadGoals = async () => {
      try {
        const data = await productivityService.getGoals();
        if (active) setGoals(data);
      } catch {
        if (active) setError('Зорилгын мэдээлэл ачаалж чадсангүй.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadGoals();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const currentDate = today();
    const todayGoals = goals.filter((goal) => goal.date === currentDate);
    const carryOverGoals = goals.filter((goal) => goal.date < currentDate && !goal.completed);
    const completedToday = todayGoals.filter((goal) => goal.completed).length;
    const completedAll = goals.filter((goal) => goal.completed).length;

    return {
      todayGoals,
      carryOverGoals,
      completedToday,
      completedAll,
      rate: todayGoals.length ? Math.round((completedToday / todayGoals.length) * 100) : 0,
    };
  }, [goals]);

  const createGoal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || saving) return;

    setSaving(true);
    setError(null);

    try {
      const goal = await productivityService.createGoal({
        title: title.trim(),
        date: goalDate || today(),
        completed: false,
      });
      setGoals((current) => [goal, ...current]);
      setTitle('');
      setGoalDate(today());
    } catch {
      setError('Зорилго хадгалах үед алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  const toggleGoal = async (goal: DailyGoal) => {
    setError(null);

    try {
      const updated = await productivityService.updateGoal(goal.id, { completed: !goal.completed });
      setGoals((current) => current.map((item) => (item.id === goal.id ? updated : item)));
    } catch {
      setError('Зорилгын төлөв шинэчлэх үед алдаа гарлаа.');
    }
  };

  const renderGoal = (goal: DailyGoal) => {
    const Icon = goal.completed ? CheckCircle2 : Circle;

    return (
      <button
        key={goal.id}
        type="button"
        onClick={() => toggleGoal(goal)}
        className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        <Icon className={goal.completed ? 'h-5 w-5 text-green-600' : 'h-5 w-5 text-gray-400'} />
        <span className="min-w-0 flex-1">
          <span className={goal.completed ? 'block text-sm text-gray-400 line-through' : 'block text-sm font-medium text-gray-900 dark:text-white'}>
            {goal.title}
          </span>
          <span className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <CalendarDays className="h-3.5 w-3.5" />
            {goal.date}
          </span>
        </span>
      </button>
    );
  };

  const recentGoals = goals
    .filter((goal) => goal.date !== today())
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Goal Wall</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Өдрийн зорилго, биелэлт, хоцорсон carry-over ажлыг нэг дор хянаж сарын тайлангийн суурь дата үүсгэнэ.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <div className="text-sm text-gray-500">Today goals</div>
          <div className="mt-2 text-3xl font-semibold">{stats.todayGoals.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Completed today</div>
          <div className="mt-2 text-3xl font-semibold">{stats.completedToday}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Completion rate</div>
          <div className="mt-2 text-3xl font-semibold">{stats.rate}%</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Carry-over</div>
          <div className="mt-2 text-3xl font-semibold">{stats.carryOverGoals.length}</div>
        </Card>
      </div>

      <Card title="New goal">
        <form onSubmit={createGoal} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Goal title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            type="date"
            value={goalDate}
            onChange={(event) => setGoalDate(event.target.value)}
            aria-label="Goal date"
          />
          <Button type="submit" icon={Plus} loading={saving}>
            Add goal
          </Button>
        </form>
      </Card>

      {loading ? (
        <Card>Зорилгуудыг ачаалж байна...</Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-3">
          <Card title="Today">
            <div className="space-y-3">
              {stats.todayGoals.length ? (
                stats.todayGoals.map(renderGoal)
              ) : (
                <EmptyState
                  icon={Target}
                  title="No goals for today"
                  description="Add a small set of daily goals to make monthly progress and carry-over work easier to review."
                />
              )}
            </div>
          </Card>

          <Card title="Carry-over">
            <div className="space-y-3">
              {stats.carryOverGoals.length ? (
                stats.carryOverGoals.map(renderGoal)
              ) : (
                <p className="text-sm text-gray-500">Хоцорсон зорилго алга.</p>
              )}
            </div>
          </Card>

          <Card title="Recent goals">
            <div className="space-y-3">
              {recentGoals.length ? (
                recentGoals.map(renderGoal)
              ) : (
                <p className="text-sm text-gray-500">Өмнөх эсвэл ирээдүйн зорилго одоогоор алга.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {!loading && goals.length > 0 && (
        <Card title="Progress snapshot">
          <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Нийт {goals.length} зорилгоос {stats.completedAll} нь биелсэн байна.
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {goals.length ? Math.round((stats.completedAll / goals.length) * 100) : 0}% overall
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className="h-2 rounded-full bg-green-600"
              style={{ width: `${goals.length ? Math.round((stats.completedAll / goals.length) * 100) : 0}%` }}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default DailyGoalsPage;
