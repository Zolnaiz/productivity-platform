import React, { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../common/Button';
import Card from '../common/Card';
import Textarea from '../common/Textarea';
import { apiErrorMessage } from '../../i18n/apiError';
import { monthSummaryService, MonthSummary } from '../../services/monthSummary.service';

/**
 * The words at the head of a month's report.
 *
 * Everybody reads the approved summary. A manager can ask Claude for a
 * draft from the month's figures - nobody is named in what is sent - read
 * it, change what needs changing, and approve it; or write it themselves.
 * A draft says it is one until a person has approved it.
 */
const MonthSummaryCard: React.FC<{ month: string; canWrite: boolean }> = ({ month, canWrite }) => {
  const { t, i18n } = useTranslation();
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<'draft' | 'save' | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoaded(false);
    setProblem(null);
    monthSummaryService
      .get(month)
      .then((value) => {
        if (!active) return;
        setSummary(value);
        setText(value?.text ?? '');
      })
      .catch(() => active && setSummary(null))
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [month]);

  const approved = Boolean(summary?.approvedAt);

  const draft = async () => {
    setBusy('draft');
    setProblem(null);
    try {
      const drafted = await monthSummaryService.draft(month, i18n.language === 'en' ? 'en' : 'mn');
      setSummary(drafted);
      setText(drafted.text);
    } catch (error) {
      setProblem(apiErrorMessage(error, t));
    } finally {
      setBusy(null);
    }
  };

  const save = async (approve: boolean) => {
    setBusy('save');
    setProblem(null);
    try {
      const saved = await monthSummaryService.save(month, text, approve);
      setSummary(saved);
      setText(saved.text);
    } catch (error) {
      setProblem(apiErrorMessage(error, t));
    } finally {
      setBusy(null);
    }
  };

  if (!loaded) return null;
  // Somebody who reads the report sees the summary once it is approved, and nothing before.
  if (!canWrite && !approved) return null;

  return (
    <Card
      title={t('monthSummary.title')}
      subtitle={
        approved
          ? t('monthSummary.approvedOn', { date: summary?.approvedAt?.slice(0, 10) })
          : summary?.aiDrafted
            ? t('monthSummary.aiDraft')
            : t('monthSummary.notApproved')
      }
    >
      {canWrite ? (
        <div className="space-y-3" data-testid="month-summary-editor">
          <Textarea
            label={t('monthSummary.label')}
            rows={7}
            value={text}
            placeholder={t('monthSummary.placeholder')}
            onChange={(event) => setText(event.target.value)}
          />
          {summary?.aiDrafted && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200" data-testid="ai-notice">
              {t('monthSummary.checkIt')}
            </p>
          )}
          {problem && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {problem}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" icon={Sparkles} type="button" onClick={draft} disabled={busy !== null}>
              {busy === 'draft' ? t('monthSummary.drafting') : t('monthSummary.draftWithAi')}
            </Button>
            <Button variant="outline" type="button" onClick={() => void save(false)} disabled={busy !== null || !text.trim()}>
              {t('monthSummary.saveDraft')}
            </Button>
            <Button icon={CheckCircle2} type="button" onClick={() => void save(true)} disabled={busy !== null || !text.trim()}>
              {t('monthSummary.approve')}
            </Button>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('monthSummary.privacy')}</p>
        </div>
      ) : (
        <p className="whitespace-pre-line text-sm leading-6 text-gray-800 dark:text-gray-200" data-testid="month-summary-text">
          {summary?.text}
        </p>
      )}
    </Card>
  );
};

export default MonthSummaryCard;
