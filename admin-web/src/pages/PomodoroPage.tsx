import React, { useEffect, useState } from 'react';
import Card from '../components/common/Card';
import { productivityService } from '../services/productivity.service';
import { FocusSession } from '../types/productivity.types';

const PomodoroPage: React.FC = () => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [draft, setDraft] = useState({ title: '', minutes: '25' });

  useEffect(() => {
    productivityService.getFocusSessions().then(setSessions);
  }, []);

  const createSession = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    const session = await productivityService.createFocusSession({
      title: draft.title,
      minutes: Number(draft.minutes || 25),
      date: new Date().toISOString().slice(0, 10),
    });
    setSessions((current) => [session, ...current]);
    setDraft({ title: '', minutes: '25' });
  };

  const totalMinutes = sessions.reduce((sum, session) => sum + session.minutes, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Pomodoro / Focus</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Focus session бүртгэж тухайн өдрийн ажилласан төвлөрсөн цагийг хэмжинэ.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-sm text-gray-500">Focus sessions</div>
          <div className="mt-2 text-3xl font-semibold">{sessions.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Focus minutes</div>
          <div className="mt-2 text-3xl font-semibold">{totalMinutes}</div>
        </Card>
      </div>

      <Card title="Log focus session">
        <form onSubmit={createSession} className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 md:col-span-2"
            placeholder="What did you focus on?"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
          <div className="flex gap-3">
            <input
              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              type="number"
              value={draft.minutes}
              onChange={(event) => setDraft((current) => ({ ...current, minutes: event.target.value }))}
            />
            <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
              Add
            </button>
          </div>
        </form>
      </Card>

      <Card title="Sessions">
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{session.title}</div>
                <div className="text-sm text-gray-500">{session.date}</div>
              </div>
              <div className="font-semibold text-blue-600">{session.minutes}m</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PomodoroPage;
