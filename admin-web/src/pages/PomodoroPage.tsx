import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
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
        <form onSubmit={createSession} className="grid items-end gap-3 md:grid-cols-3">
          <Input
            className="md:col-span-2"
            label="What did you focus on?"
            placeholder="What did you focus on?"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
          <div className="flex items-end gap-3">
            <Input
              className="w-24"
              label="Minutes"
              type="number"
              value={draft.minutes}
              onChange={(event) => setDraft((current) => ({ ...current, minutes: event.target.value }))}
            />
            <Button className="flex-1" type="submit">
              Add
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Sessions">
        <div className="space-y-3">
          {sessions.length ? (
            sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{session.title}</div>
                  <div className="text-sm text-gray-500">{session.date}</div>
                </div>
                <div className="font-semibold text-blue-600">{session.minutes}m</div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={Timer}
              title="No focus sessions logged"
              description="Log focused work blocks here so daily focus time can be included in productivity reports."
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default PomodoroPage;
