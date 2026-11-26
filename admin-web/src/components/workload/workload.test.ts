/** Unit test for workload.ts: the browser's mirror of the server's workload rule (demo workspace). */
import { describe, expect, it } from 'vitest';
import { UNESTIMATED_TASK_HOURS, WorkloadTask, previewAssignment, workloadByPerson } from './workload';

const today = '2026-11-25';
const task = (over: Partial<WorkloadTask>): WorkloadTask => ({
  id: Math.random().toString(36),
  assigneeId: 'ana',
  status: 'todo',
  dueDate: '2026-11-27',
  estimatedHours: 8,
  actualHours: 0,
  ...over,
});

describe('workload mirror', () => {
  it('counts remaining hours of open work due this week against 40 hours, as the server does', () => {
    const [ana] = workloadByPerson([task({ estimatedHours: 30, actualHours: 6 }), task({ estimatedHours: 0 })], today);
    expect(ana).toMatchObject({ open: 2, hours: 24 + UNESTIMATED_TASK_HOURS, percent: 70, level: 'free' });
  });

  it('previews the candidates quietest first, with the same warnings as the server', () => {
    const tasks = [task({ estimatedHours: 36 }), task({ dueDate: '2026-11-01', estimatedHours: 1 })];
    const preview = previewAssignment(tasks, ['ana', 'bat'], { dueDate: today, estimatedHours: 8, status: 'todo' }, today);
    expect(preview.map((p) => p.userId)).toEqual(['bat', 'ana']);
    expect(preview[1].warnings).toEqual(['over_capacity', 'has_overdue']);
    expect(preview[0].warnings).toEqual([]);
  });
});
