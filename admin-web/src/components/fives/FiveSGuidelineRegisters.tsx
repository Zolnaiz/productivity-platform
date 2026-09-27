import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  ListPlus,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import Card from '../common/Card';
import ConfirmDialog from '../common/ConfirmDialog';
import { fiveSGuidelineService } from '../../services/fiveSGuideline.service';
import { operationsService } from '../../services/operations.service';
import { WorkTask } from '../../types/operations.types';
import { useAuth } from '../../contexts/AuthContext';
import FiveSStandardEditor from './FiveSStandardEditor';
import {
  FiveSAssessmentScore,
  FiveSGuidelineContent,
  FiveSChecklistProgress,
  FiveSGuidelineState,
  FiveSImplementationCard,
  FiveSImplementationReason,
  FiveSImplementationStatus,
  FiveSImprovementRecord,
  FiveSImprovementStatus,
} from '../../types/fiveS.types';

const fieldClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900';

const textareaClass = `${fieldClass} min-h-[72px]`;

/*
  The choices are worded from the locale files. They were half English and
  half Mongolian here, so each language got a register that was partly in the
  other one.
*/
const improvementStatuses: FiveSImprovementStatus[] = ['open', 'in_progress', 'management_review', 'closed'];

const reasons: FiveSImplementationReason[] = ['defective', 'unused', 'excess', 'unnecessary'];

const implementationStatuses: FiveSImplementationStatus[] = ['identified', 'review', 'approved', 'removed', 'returned'];

/** English for the CSV, which has no reader to ask, like every export here. */
const reasonInEnglish: Record<FiveSImplementationReason, string> = {
  defective: 'Defective',
  unused: 'Unused for a long time',
  excess: 'Excess',
  unnecessary: 'Unnecessary',
};

/*
  The standard this page is read against — the cadence, the labelling rules,
  the assessment criteria, the checklists — used to be a hundred Mongolian
  strings here. They are one organization's 5S standard rather than the
  product's copy, so they now come from that organization's own register. See
  `backend/src/operations/five-s-guideline-content.ts` for what a new one is
  created with.
*/
const escapeCsvCell = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const downloadCsv = (filename: string, headers: string[], rows: Array<Array<string | number | undefined>>) => {
  const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

/** Which row the trash icon was clicked on, and which register it belongs to. */
type PendingRemoval = { kind: 'improvement' | 'implementationCard'; id: string };

const emptyContent: FiveSGuidelineContent = {
  operatingCadence: [],
  labelStandards: [],
  assessmentCriteria: [],
  publicChecklistGroups: [],
  maxScore: 0,
};

const emptyState: FiveSGuidelineState = {
  improvements: [],
  implementationCards: [],
  assessmentScores: [],
  checklistProgress: [],
  updatedAt: '',
};

const FiveSGuidelineRegisters: React.FC = () => {
  const { t } = useTranslation();
  /*
    Rewriting what everybody is judged against is an administrator's act, and
    the page asks the server's own table rather than guessing from a role.
  */
  const { hasPermission } = useAuth();
  /*
    The registers are the organization's now rather than this browser's, so
    they are fetched rather than read out of storage. Empty until they arrive:
    showing the demo's sample rows for a moment would put somebody else's
    finding in front of a reader as though it were theirs.
  */
  const [state, setState] = useState<FiveSGuidelineState>(emptyState);
  const [content, setContent] = useState<FiveSGuidelineContent>(emptyContent);
  const [actionMessage, setActionMessage] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  /*
    The work raised from each improvement, by the record's id. An action plan
    written in a register and given to nobody is a wish; as a task it has an
    owner, a date and a place on the progress board.
  */
  const [improvementTasks, setImprovementTasks] = useState<Map<string, WorkTask>>(new Map());
  const canReadTasks = hasPermission('tasks:read');
  const canRaiseTasks = hasPermission('tasks:create');

  /*
    Read on arrival, and again whenever the tab comes back into view. The
    server moves a record on by itself - finishing its task sends it to
    management review - and a page left open from before would otherwise
    write the old status back with its next keystroke.
  */
  useEffect(() => {
    let active = true;

    const refresh = () => {
      void fiveSGuidelineService.getRegister().then((register) => {
        if (!active) return;
        setContent(register.content);
        setState(register.records);
      });

      if (!canReadTasks) return;
      operationsService
        .getTasks()
        .then((tasks) => {
          if (!active) return;
          const raised = tasks.filter((task) => task.sourceType === 'five_s_improvement' && task.sourceId);
          // Finished ones first, so an open task raised again after them wins.
          raised.sort((a, b) => Number(a.status !== 'done') - Number(b.status !== 'done'));
          setImprovementTasks(new Map(raised.map((task) => [task.sourceId as string, task])));
        })
        .catch(() => {
          // The register stands without them; the button is still offered.
        });
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    refresh();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [canReadTasks]);

  const scoreById = useMemo(
    () => new Map(state.assessmentScores.map((score) => [score.id, score])),
    [state.assessmentScores],
  );

  const checklistById = useMemo(
    () => new Map(state.checklistProgress.map((item) => [item.id, item])),
    [state.checklistProgress],
  );

  const assessmentTotal = useMemo(
    () => state.assessmentScores.reduce((total, item) => total + Number(item.score || 0), 0),
    [state.assessmentScores],
  );

  const assessmentPercent = Math.min(100, Math.round((assessmentTotal / (content.maxScore || 1)) * 100));

  const checklistItems = content.publicChecklistGroups.flatMap((group) =>
    group.items.map((item, index) => ({ id: `${group.code}-${index + 1}`, group: group.title, item })),
  );

  const checklistDone = checklistItems.filter((item) => checklistById.get(item.id)?.done).length;
  const checklistPercent = checklistItems.length ? Math.round((checklistDone / checklistItems.length) * 100) : 0;

  /**
   * Shows the change at once and sends it afterwards.
   *
   * Typing into a register that waits for a round trip before showing the
   * character is a register nobody types into. The save is what makes it the
   * organization's; the screen is not made to wait for it, and the service
   * keeps a local copy if it fails.
   */
  const updateState = (build: (current: FiveSGuidelineState) => FiveSGuidelineState) => {
    setState((current) => {
      const next = build(current);

      void fiveSGuidelineService.saveState(next);

      return next;
    });
  };

  const addImprovement = () => {
    updateState((current) => ({
      ...current,
      improvements: [...current.improvements, fiveSGuidelineService.createImprovementRecord()],
    }));
    setActionMessage(t('fiveSRegisters.improvementAdded'));
  };

  const updateImprovement = (id: string, patch: Partial<FiveSImprovementRecord>) => {
    updateState((current) => ({
      ...current,
      improvements: current.improvements.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const raiseImprovementTask = async (item: FiveSImprovementRecord) => {
    try {
      const task = await operationsService.createTask({
        title: t('fiveSRegisters.improvementTaskTitle', {
          area: item.area.trim() || t('fiveSRegisters.improvementNoArea'),
        }),
        // Their own words: what the team decided to do about it.
        description: item.actionPlan.trim() || item.teamDecision.trim() || item.symptomLoss.trim() || undefined,
        sourceType: 'five_s_improvement',
        sourceId: item.id,
        status: 'todo',
        priority: 'medium',
      });
      setImprovementTasks((current) => new Map(current).set(item.id, task));
      if (item.status === 'open') updateImprovement(item.id, { status: 'in_progress' });
      setActionMessage(t('fiveSRegisters.improvementTaskRaised'));
    } catch {
      setActionMessage(t('fiveSRegisters.improvementTaskFailed'));
    }
  };

  const removeImprovement = (id: string) => {
    updateState((current) => ({
      ...current,
      improvements: current.improvements.filter((item) => item.id !== id),
    }));
    setActionMessage(t('fiveSRegisters.improvementRemoved'));
  };

  const addImplementationCard = () => {
    updateState((current) => ({
      ...current,
      implementationCards: [...current.implementationCards, fiveSGuidelineService.createImplementationCard()],
    }));
    setActionMessage(t('fiveSRegisters.cardAdded'));
  };

  const updateImplementationCard = (id: string, patch: Partial<FiveSImplementationCard>) => {
    updateState((current) => ({
      ...current,
      implementationCards: current.implementationCards.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const removeImplementationCard = (id: string) => {
    updateState((current) => ({
      ...current,
      implementationCards: current.implementationCards.filter((item) => item.id !== id),
    }));
    setActionMessage(t('fiveSRegisters.cardRemoved'));
  };

  // A row is written to storage the moment it changes and there is no undo
  // here, unlike the canvas — so a typed-in record is confirmed before it goes.
  const confirmRemoval = () => {
    if (!pendingRemoval) return;

    if (pendingRemoval.kind === 'improvement') {
      removeImprovement(pendingRemoval.id);
    } else {
      removeImplementationCard(pendingRemoval.id);
    }

    setPendingRemoval(null);
  };

  const updateAssessmentScore = (id: string, patch: Partial<FiveSAssessmentScore>) => {
    updateState((current) => {
      const existing = current.assessmentScores.find((item) => item.id === id);
      const nextScore: FiveSAssessmentScore = {
        id,
        score: 0,
        note: '',
        ...existing,
        ...patch,
      };

      return {
        ...current,
        assessmentScores: existing
          ? current.assessmentScores.map((item) => (item.id === id ? nextScore : item))
          : [...current.assessmentScores, nextScore],
      };
    });
  };

  const updateChecklistProgress = (id: string, patch: Partial<FiveSChecklistProgress>) => {
    updateState((current) => {
      const existing = current.checklistProgress.find((item) => item.id === id);
      const nextItem: FiveSChecklistProgress = {
        id,
        done: false,
        note: '',
        ...existing,
        ...patch,
      };

      return {
        ...current,
        checklistProgress: existing
          ? current.checklistProgress.map((item) => (item.id === id ? nextItem : item))
          : [...current.checklistProgress, nextItem],
      };
    });
  };

  const exportImprovements = () => {
    downloadCsv(
      '5s-improvement-register.csv',
      [
        'Area / Responsible',
        'Date',
        'When',
        'Duration',
        'Symptom / loss',
        'Root cause',
        'Team decision',
        'Action plan',
        'Management decision',
        'Status',
      ],
      state.improvements.map((item) => [
        `${item.area} / ${item.responsible}`,
        item.recordDate,
        item.whenObserved,
        item.duration,
        item.symptomLoss,
        item.rootCause,
        item.teamDecision,
        item.actionPlan,
        item.managementDecision,
        item.status,
      ]),
    );
    setActionMessage(t('fiveSRegisters.improvementsExported'));
  };

  const exportImplementationCards = () => {
    downloadCsv(
      '5s-implementation-cards.csv',
      ['Tag', 'No.', 'Quantity', 'Item', 'Reason', 'Department', 'Date', 'Owner', 'Decision', 'Status'],
      state.implementationCards.map((item) => [
        item.tagType,
        item.itemNumber,
        item.quantity,
        item.itemName,
        reasonInEnglish[item.reason],
        item.department,
        item.date,
        item.owner,
        item.decision,
        item.status,
      ]),
    );
    setActionMessage(t('fiveSRegisters.cardsExported'));
  };

  const exportAssessment = () => {
    downloadCsv(
      '5s-organization-baseline-assessment.csv',
      ['Category', 'Criterion', 'Score', 'Note'],
      content.assessmentCriteria.map((criterion) => {
        const score = scoreById.get(criterion.id);
        return [criterion.category, criterion.criterion, score?.score ?? 0, score?.note ?? ''];
      }),
    );
    setActionMessage(t('fiveSRegisters.assessmentExported'));
  };

  const exportChecklist = () => {
    downloadCsv(
      '5s-public-area-checklist.csv',
      ['Group', 'Checklist item', 'Done', 'Note'],
      checklistItems.map((item) => {
        const progress = checklistById.get(item.id);
        return [item.group, item.item, progress?.done ? 'yes' : 'no', progress?.note ?? ''];
      }),
    );
    setActionMessage(t('fiveSRegisters.checklistExported'));
  };

  return (
    <div className="space-y-6">
      {actionMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
          {actionMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title={t('fiveSRegisters.cadenceTitle')} subtitle={t('fiveSRegisters.cadenceSubtitle')}>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {content.operatingCadence.map((item) => (
              <div key={item.title} className="grid gap-3 py-3 md:grid-cols-[180px_160px_1fr]">
                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                  {item.title}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{item.timing}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.detail}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('fiveSRegisters.labelsTitle')} subtitle={t('fiveSRegisters.labelsSubtitle')}>
          <div className="space-y-3">
            {content.labelStandards.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700">
                <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                  {index + 1}
                </div>
                <div className="text-gray-700 dark:text-gray-300">{item}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title={t('fiveSRegisters.improvementsTitle')}
        subtitle={t('fiveSRegisters.improvementsSubtitle')}
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download} onClick={exportImprovements} type="button">
              CSV
            </Button>
            <Button size="sm" icon={Plus} onClick={addImprovement} type="button">
              {t('fiveSRegisters.addRow')}
            </Button>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-[1280px] divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-3">{t('fiveSRegisters.areaOwner')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.date')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.when')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.duration')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.symptomLoss')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.rootCause')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.teamDecision')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.actionPlan')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.management')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.status')}</th>
                <th className="px-3 py-3" aria-label={t('fiveSRegisters.actions')} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {state.improvements.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-3 align-top">
                    <div className="space-y-2">
                      <input className={fieldClass} value={item.area} placeholder={t('fiveSRegisters.areaPlaceholder')} onChange={(event) => updateImprovement(item.id, { area: event.target.value })} />
                      <input className={fieldClass} value={item.responsible} placeholder={t('fiveSRegisters.ownerPlaceholder')} onChange={(event) => updateImprovement(item.id, { responsible: event.target.value })} />
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} type="date" value={item.recordDate} onChange={(event) => updateImprovement(item.id, { recordDate: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} value={item.whenObserved} onChange={(event) => updateImprovement(item.id, { whenObserved: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} value={item.duration} onChange={(event) => updateImprovement(item.id, { duration: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.symptomLoss} onChange={(event) => updateImprovement(item.id, { symptomLoss: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.rootCause} onChange={(event) => updateImprovement(item.id, { rootCause: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.teamDecision} onChange={(event) => updateImprovement(item.id, { teamDecision: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.actionPlan} onChange={(event) => updateImprovement(item.id, { actionPlan: event.target.value })} />
                    {(() => {
                      const task = improvementTasks.get(item.id);

                      if (task && task.status !== 'done') {
                        return (
                          <Link
                            to="/progress"
                            className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:underline dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {t('fiveSRegisters.improvementTaskStatus', {
                              status: t(`tasks.status.${task.status === 'in_progress' ? 'inProgress' : task.status}`),
                            })}
                          </Link>
                        );
                      }

                      return canRaiseTasks && item.status !== 'closed' ? (
                        <Button
                          className="mt-2"
                          variant="outline"
                          size="sm"
                          icon={ListPlus}
                          onClick={() => void raiseImprovementTask(item)}
                          type="button"
                        >
                          {t('fiveSRegisters.raiseImprovementTask')}
                        </Button>
                      ) : null;
                    })()}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.managementDecision} onChange={(event) => updateImprovement(item.id, { managementDecision: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <select className={fieldClass} value={item.status} onChange={(event) => updateImprovement(item.id, { status: event.target.value as FiveSImprovementStatus })}>
                      {improvementStatuses.map((value) => (
                        <option key={value} value={value}>
                          {t(`fiveSRegisters.improvementStatus.${value}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setPendingRemoval({ kind: 'improvement', id: item.id })} aria-label={t('fiveS.deleteImprovement')} type="button" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title={t('fiveSRegisters.cardsTitle')}
        subtitle={t('fiveSRegisters.cardsSubtitle')}
        actions={
          <>
            <Button variant="outline" size="sm" icon={Download} onClick={exportImplementationCards} type="button">
              CSV
            </Button>
            <Button size="sm" icon={Tag} onClick={addImplementationCard} type="button">
              {t('fiveSRegisters.addCard')}
            </Button>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-[1040px] divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-3">{t('fiveSRegisters.tag')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.numberQuantity')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.item')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.reason')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.department')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.date')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.owner')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.decision')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.status')}</th>
                <th className="px-3 py-3" aria-label={t('fiveSRegisters.actions')} />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {state.implementationCards.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-3 align-top">
                    <select className={fieldClass} value={item.tagType} onChange={(event) => updateImplementationCard(item.id, { tagType: event.target.value as FiveSImplementationCard['tagType'] })}>
                      <option value="1C">1C</option>
                      <option value="2C">2C</option>
                      <option value="3C">3C</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="space-y-2">
                      <input className={fieldClass} value={item.itemNumber} placeholder={t('fiveSRegisters.numberPlaceholder')} onChange={(event) => updateImplementationCard(item.id, { itemNumber: event.target.value })} />
                      <input className={fieldClass} value={item.quantity} placeholder={t('fiveSRegisters.quantityPlaceholder')} onChange={(event) => updateImplementationCard(item.id, { quantity: event.target.value })} />
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} value={item.itemName} onChange={(event) => updateImplementationCard(item.id, { itemName: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <select className={fieldClass} value={item.reason} onChange={(event) => updateImplementationCard(item.id, { reason: event.target.value as FiveSImplementationReason })}>
                      {reasons.map((value) => (
                        <option key={value} value={value}>
                          {t(`fiveSRegisters.reasons.${value}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} value={item.department} onChange={(event) => updateImplementationCard(item.id, { department: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} type="date" value={item.date} onChange={(event) => updateImplementationCard(item.id, { date: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <input className={fieldClass} value={item.owner} onChange={(event) => updateImplementationCard(item.id, { owner: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <textarea className={textareaClass} value={item.decision} onChange={(event) => updateImplementationCard(item.id, { decision: event.target.value })} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    <select className={fieldClass} value={item.status} onChange={(event) => updateImplementationCard(item.id, { status: event.target.value as FiveSImplementationStatus })}>
                      {implementationStatuses.map((value) => (
                        <option key={value} value={value}>
                          {t(`fiveSRegisters.cardStatus.${value}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => setPendingRemoval({ kind: 'implementationCard', id: item.id })} aria-label={t('fiveS.deleteImplementationCard')} type="button" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title={t('fiveSRegisters.assessmentTitle')}
        // The maximum is the organization's own standard's, not a number
        // written here: an edited standard has a different one.
        subtitle={t('fiveSRegisters.assessmentSubtitle', { max: content.maxScore })}
        actions={
          <Button variant="outline" size="sm" icon={Download} onClick={exportAssessment} type="button">
            CSV
          </Button>
        }
      >
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">{t('fiveSRegisters.currentScore')}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{assessmentTotal}/{content.maxScore}</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">{t('fiveSRegisters.readiness')}</div>
            <div className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-300">{assessmentPercent}%</div>
          </div>
          <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="text-xs text-gray-500">{t('fiveSRegisters.criteria')}</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{content.assessmentCriteria.length}</div>
          </div>
        </div>
        <div className="max-h-[520px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="sticky top-0 bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-3">{t('fiveSRegisters.category')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.criterion')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.score')}</th>
                <th className="px-3 py-3">{t('fiveSRegisters.note')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {content.assessmentCriteria.map((criterion) => {
                const score = scoreById.get(criterion.id);
                return (
                  <tr key={criterion.id}>
                    <td className="w-52 px-3 py-3 text-gray-600 dark:text-gray-300">{criterion.category}</td>
                    <td className="px-3 py-3 text-gray-800 dark:text-gray-100">{criterion.criterion}</td>
                    <td className="w-28 px-3 py-3">
                      <select className={fieldClass} value={score?.score ?? 0} onChange={(event) => updateAssessmentScore(criterion.id, { score: Number(event.target.value) })}>
                        {[0, 1, 2, 3, 4, 5].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="w-72 px-3 py-3">
                      <input className={fieldClass} value={score?.note ?? ''} onChange={(event) => updateAssessmentScore(criterion.id, { note: event.target.value })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title={t('fiveSRegisters.checklistTitle')}
        subtitle={t('fiveSRegisters.checklistSubtitle')}
        actions={
          <Button variant="outline" size="sm" icon={Download} onClick={exportChecklist} type="button">
            CSV
          </Button>
        }
      >
        <div className="mb-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <ClipboardList className="h-4 w-4 text-blue-500" />
              {t('fiveSRegisters.setupCompletion')}
            </div>
            <div className="text-sm font-semibold text-blue-600 dark:text-blue-300">
              {checklistDone}/{checklistItems.length} ({checklistPercent}%)
            </div>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {content.publicChecklistGroups.map((group) => (
            <section key={group.code} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="mb-3 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                <BookOpen className="h-4 w-4 text-blue-500" />
                {group.title}
              </div>
              <div className="space-y-3">
                {group.items.map((item, index) => {
                  const id = `${group.code}-${index + 1}`;
                  const progress = checklistById.get(id);
                  return (
                    <div key={id} className="grid gap-2 rounded-lg border border-gray-100 p-3 dark:border-gray-700 md:grid-cols-[1fr_220px]">
                      <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600"
                          type="checkbox"
                          checked={progress?.done ?? false}
                          onChange={(event) => updateChecklistProgress(id, { done: event.target.checked })}
                        />
                        <span>{item}</span>
                      </label>
                      <input
                        className={fieldClass}
                        value={progress?.note ?? ''}
                        placeholder={t('fiveSRegisters.note')}
                        onChange={(event) => updateChecklistProgress(id, { note: event.target.value })}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </Card>

      <Card title={t('fiveSRegisters.recordsTitle')} subtitle={t('fiveSRegisters.recordsSubtitle')}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(['assessmentSheet', 'auditLog', 'improvementLog', 'infoBoard'] as const)
            .map((key) => [t(`fiveSRegisters.records.${key}.title`), t(`fiveSRegisters.records.${key}.detail`)])
            .map(([title, detail]) => (
            <div key={title} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                <FileText className="h-4 w-4 text-blue-500" />
                {title}
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{detail}</div>
            </div>
          ))}
        </div>
      </Card>

      {hasPermission('guidelines:manage') && (
        <FiveSStandardEditor
          content={content}
          onSave={async (next) => {
            const saved = await fiveSGuidelineService.saveContent(next);
            setContent(saved);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingRemoval)}
        title={
          pendingRemoval?.kind === 'implementationCard'
            ? t('fiveS.deleteImplementationCard')
            : t('fiveS.deleteImprovement')
        }
        message={
          pendingRemoval?.kind === 'implementationCard'
            ? t('fiveS.deleteImplementationCardMessage')
            : t('fiveS.deleteImprovementMessage')
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
};

export default FiveSGuidelineRegisters;
