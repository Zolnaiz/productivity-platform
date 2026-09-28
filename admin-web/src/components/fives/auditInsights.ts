import { AuditRun, AuditTemplate } from '../../types/operations.types';
import { fellShort } from './auditAnswers';

export interface MonthPoint {
  /** YYYY-MM. */
  month: string;
  /** Average score of the month's walks, or null for a month with none. */
  average: number | null;
  count: number;
}

export interface ShortfallCount {
  questionId: string;
  text: string;
  count: number;
  /** Of every shortfall counted, this question's part, 0-100. */
  share: number;
  /** This question's part added to every bigger one's, 0-100: the Pareto line. */
  cumulative: number;
}

const monthOf = (value?: string) => value?.slice(0, 7);

/** The `count` months ending with the one `today` is in, oldest first. */
export const lastMonths = (today: string, count: number) => {
  const [year, month] = today.split('-').map(Number);
  return Array.from({ length: count }, (_, index) => {
    const at = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));
    return at.toISOString().slice(0, 7);
  });
};

/**
 * The average audit score, month by month. The first question a manager
 * asks of a 5S programme is whether it is holding; one score says how an
 * area is today, twelve say whether it is sustained.
 */
export const monthlyTrend = (runs: AuditRun[], today: string, months = 12): MonthPoint[] =>
  lastMonths(today, months).map((month) => {
    const inMonth = runs.filter((run) => monthOf(run.createdAt) === month);
    return {
      month,
      count: inMonth.length,
      average: inMonth.length
        ? Math.round(inMonth.reduce((sum, run) => sum + Number(run.score || 0), 0) / inMonth.length)
        : null,
    };
  });

/**
 * Which checklist questions fall short most often, biggest first.
 *
 * A Pareto chart, as Redzone and every lean problem-solving board draw it:
 * a handful of questions usually account for most failures, and fixing
 * those is where the next month's improvement comes from. Counted by the
 * question's text rather than its id, so the same question on two
 * checklists is one bar.
 */
export const shortfallPareto = (runs: AuditRun[], templates: AuditTemplate[]): ShortfallCount[] => {
  const byTemplate = new Map(templates.map((template) => [template.id, template]));
  const counts = new Map<string, { questionId: string; text: string; count: number }>();

  for (const run of runs) {
    const template = byTemplate.get(run.templateId);
    if (!template) continue;
    for (const question of template.questions) {
      const answer = run.answers?.find((item) => item.questionId === question.id)?.value;
      if (!fellShort(question, answer)) continue;
      const key = question.text.trim().toLowerCase();
      const entry = counts.get(key) ?? { questionId: question.id, text: question.text, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }

  const sorted = [...counts.values()].sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));
  const total = sorted.reduce((sum, entry) => sum + entry.count, 0);
  let running = 0;
  return sorted.map((entry) => {
    running += entry.count;
    return {
      ...entry,
      share: total ? Math.round((entry.count / total) * 100) : 0,
      cumulative: total ? Math.round((running / total) * 100) : 0,
    };
  });
};
