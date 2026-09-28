import React, { useEffect, useMemo, useState } from 'react';
import { Check, Lightbulb, Trophy, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import PhotoEvidence from '../components/common/PhotoEvidence';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import { useAuth } from '../contexts/AuthContext';
import { useSaveFailure } from '../hooks/useSaveFailure';
import { ideaService } from '../services/idea.service';
import { peopleService } from '../services/people.service';
import { Idea, IdeaDecision, IdeaStatus } from '../types/idea.types';
import { TeamUser, memberName } from '../types/people.types';

type Filter = 'all' | IdeaStatus;

const statusTone: Record<IdeaStatus, string> = {
  submitted: 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200',
  approved: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
  done: 'bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200',
  declined: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const emptyIdea = { title: '', description: '', area: '', benefit: '' };

/**
 * The idea box.
 *
 * Anybody puts an idea in; everybody sees what was suggested and what became
 * of it; somebody who runs the work takes it up - it becomes a task, for the
 * person who had it unless they say otherwise - declines it with a reason, or
 * marks it in place. Before and after photographs make the change visible,
 * and the people whose ideas were put in place are named: recognition is
 * what keeps an idea box from going quiet (KaiNexus, Rever).
 */
const IdeasPage: React.FC = () => {
  const { t } = useTranslation();
  const { hasPermission, user } = useAuth();
  const canReview = hasPermission('ideas:review');
  const canSubmit = hasPermission('ideas:create');
  const notSaved = useSaveFailure();

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [members, setMembers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draft, setDraft] = useState(emptyIdea);
  const [sending, setSending] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [deciding, setDeciding] = useState<{ id: string; status: IdeaDecision['status'] } | null>(null);
  const [decision, setDecision] = useState({ note: '', assigneeId: '', dueDate: '' });
  const [photosOpen, setPhotosOpen] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    ideaService
      .getIdeas()
      .then((data) => active && setIdeas(data ?? []))
      .catch(() => active && setLoadFailed(true))
      .finally(() => active && setLoading(false));
    Promise.resolve()
      .then(() => peopleService.getMembers())
      .then((data) => active && setMembers(data ?? []))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const nameOf = (id?: string) => {
    if (!id) return t('ideas.someone');
    if (id === user?.id) return t('ideas.you');
    const member = members.find((candidate) => candidate.id === id);
    return member ? memberName(member) : t('ideas.someone');
  };

  const counts = useMemo(
    () =>
      ideas.reduce<Record<Filter, number>>(
        (all, idea) => ({ ...all, [idea.status]: all[idea.status] + 1, all: all.all + 1 }),
        { all: 0, submitted: 0, approved: 0, done: 0, declined: 0 },
      ),
    [ideas],
  );

  // Who has had ideas taken up this year: named, as the people who made things better.
  const improvers = useMemo(() => {
    const year = String(new Date().getFullYear());
    const tally = new Map<string, number>();
    for (const idea of ideas) {
      if ((idea.status === 'approved' || idea.status === 'done') && idea.authorId && (idea.createdAt ?? year).startsWith(year)) {
        tally.set(idea.authorId, (tally.get(idea.authorId) ?? 0) + 1);
      }
    }
    return [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [ideas]);

  const visible = filter === 'all' ? ideas : ideas.filter((idea) => idea.status === filter);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.title.trim().length < 3) return;
    setSending(true);
    try {
      const created = await ideaService.createIdea(draft);
      setIdeas((current) => [created, ...current]);
      setDraft(emptyIdea);
      setThanks(true);
    } catch (error) {
      notSaved(error);
    } finally {
      setSending(false);
    }
  };

  const startDeciding = (idea: Idea, status: IdeaDecision['status']) => {
    setDeciding({ id: idea.id, status });
    setDecision({ note: '', assigneeId: idea.authorId ?? '', dueDate: '' });
  };

  const decide = async (idea: Idea, status: IdeaDecision['status']) => {
    try {
      const reviewed = await ideaService.reviewIdea(idea.id, {
        status,
        note: decision.note.trim() || undefined,
        assigneeId: status === 'approved' ? decision.assigneeId || undefined : undefined,
        dueDate: status === 'approved' ? decision.dueDate || undefined : undefined,
      });
      setIdeas((current) => current.map((item) => (item.id === idea.id ? { ...item, ...reviewed } : item)));
      setDeciding(null);
    } catch (error) {
      notSaved(error);
    }
  };

  const filters: Filter[] = ['all', 'submitted', 'approved', 'done', 'declined'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('ideas.title')}</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">{t('ideas.subtitle')}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {canSubmit && (
            <Card title={t('ideas.newTitle')} subtitle={t('ideas.newSubtitle')}>
              <form onSubmit={submit} className="space-y-4" data-testid="idea-form">
                <Input
                  label={t('ideas.fields.title')}
                  placeholder={t('ideas.fields.titlePlaceholder')}
                  value={draft.title}
                  onChange={(event) => {
                    setThanks(false);
                    setDraft((current) => ({ ...current, title: event.target.value }));
                  }}
                  required
                  minLength={3}
                  maxLength={200}
                />
                <Textarea
                  label={t('ideas.fields.description')}
                  placeholder={t('ideas.fields.descriptionPlaceholder')}
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  rows={3}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label={t('ideas.fields.area')}
                    placeholder={t('ideas.fields.areaPlaceholder')}
                    value={draft.area}
                    onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))}
                  />
                  <Input
                    label={t('ideas.fields.benefit')}
                    placeholder={t('ideas.fields.benefitPlaceholder')}
                    value={draft.benefit}
                    onChange={(event) => setDraft((current) => ({ ...current, benefit: event.target.value }))}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" icon={Lightbulb} disabled={sending || draft.title.trim().length < 3}>
                    {t('ideas.send')}
                  </Button>
                  {thanks && (
                    <span role="status" className="text-sm text-green-700 dark:text-green-300">
                      {t('ideas.thanks')}
                    </span>
                  )}
                </div>
              </form>
            </Card>
          )}

          <div role="radiogroup" aria-label={t('ideas.filterLabel')} className="flex flex-wrap gap-2">
            {filters.map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={filter === key}
                onClick={() => setFilter(key)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === key
                    ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {t(`ideas.filter.${key}`)} <span className="tabular-nums">({counts[key]})</span>
              </button>
            ))}
          </div>

          {loading && (
            <Card loading>
              <div />
            </Card>
          )}
          {loadFailed && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {t('ideas.loadFailed')}
            </p>
          )}
          {!loading && !loadFailed && visible.length === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('ideas.empty')}</p>
          )}

          <ul className="space-y-3" data-testid="idea-list">
            {visible.map((idea) => (
              <li
                key={idea.id}
                data-testid="idea"
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 dark:text-white">{idea.title}</h2>
                    <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                      {t('ideas.byWhen', { name: nameOf(idea.authorId), date: idea.createdAt?.slice(0, 10) ?? '' })}
                      {idea.area && ` · ${idea.area}`}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[idea.status]}`}>
                    {t(`ideas.status.${idea.status}`)}
                  </span>
                </div>

                {idea.description && (
                  <p className="mt-2 whitespace-pre-line text-sm text-gray-800 dark:text-gray-200">{idea.description}</p>
                )}
                {idea.benefit && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{t('ideas.fields.benefit')}:</span> {idea.benefit}
                  </p>
                )}
                {idea.reviewNote && (
                  <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    <span className="font-medium">{t('ideas.reviewNote')}:</span> {idea.reviewNote}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
                    aria-expanded={photosOpen === idea.id}
                    onClick={() => setPhotosOpen((current) => (current === idea.id ? null : idea.id))}
                  >
                    {photosOpen === idea.id ? t('ideas.hidePhotos') : t('ideas.showPhotos')}
                  </button>
                  {idea.taskId && (
                    <Link to="/tasks" className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300">
                      {t('ideas.openTask')}
                    </Link>
                  )}
                  {canReview && idea.status === 'submitted' && (
                    <>
                      <Button size="sm" icon={Check} type="button" onClick={() => startDeciding(idea, 'approved')}>
                        {t('ideas.takeUp')}
                      </Button>
                      <Button size="sm" variant="outline" icon={X} type="button" onClick={() => startDeciding(idea, 'declined')}>
                        {t('ideas.decline')}
                      </Button>
                    </>
                  )}
                  {canReview && idea.status === 'approved' && (
                    <Button size="sm" variant="outline" icon={Check} type="button" onClick={() => startDeciding(idea, 'done')}>
                      {t('ideas.markDone')}
                    </Button>
                  )}
                </div>

                {deciding?.id === idea.id && (
                  <form
                    className="mt-3 space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    data-testid="idea-decision"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void decide(idea, deciding.status);
                    }}
                  >
                    {deciding.status === 'approved' && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Select
                          label={t('ideas.whoDoesIt')}
                          value={decision.assigneeId}
                          onChange={(event) => setDecision((current) => ({ ...current, assigneeId: event.target.value }))}
                        >
                          {idea.authorId && <option value={idea.authorId}>{nameOf(idea.authorId)}</option>}
                          {members
                            .filter((member) => member.id !== idea.authorId && member.isActive !== false)
                            .map((member) => (
                              <option key={member.id} value={member.id}>
                                {memberName(member)}
                              </option>
                            ))}
                        </Select>
                        <Input
                          label={t('ideas.dueDate')}
                          type="date"
                          value={decision.dueDate}
                          onChange={(event) => setDecision((current) => ({ ...current, dueDate: event.target.value }))}
                        />
                      </div>
                    )}
                    <Textarea
                      label={t('ideas.noteToAuthor')}
                      value={decision.note}
                      rows={2}
                      onChange={(event) => setDecision((current) => ({ ...current, note: event.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" type="submit">
                        {t(`ideas.confirm.${deciding.status}`)}
                      </Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => setDeciding(null)}>
                        {t('common.cancel')}
                      </Button>
                    </div>
                  </form>
                )}

                {photosOpen === idea.id && (
                  <div className="mt-3">
                    <PhotoEvidence ownerType="idea" ownerId={idea.id} kinds={['before', 'after']} label={idea.title} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-6">
          <Card title={t('ideas.improversTitle')} subtitle={t('ideas.improversSubtitle')}>
            {improvers.length ? (
              <ol className="space-y-2" data-testid="improvers">
                {improvers.map(([authorId, count], index) => (
                  <li key={authorId} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        index === 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {index === 0 ? <Trophy className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
                    </span>
                    <span className="flex-1 text-gray-900 dark:text-white">{nameOf(authorId)}</span>
                    <span className="tabular-nums text-gray-600 dark:text-gray-400">{t('ideas.takenUp', { count })}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('ideas.noImproversYet')}</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default IdeasPage;
