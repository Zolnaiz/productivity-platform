import React, { useEffect, useState } from 'react';
import { Plus, StickyNote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Textarea from '../components/common/Textarea';
import { productivityService } from '../services/productivity.service';
import { Note } from '../types/productivity.types';

const NotesPage: React.FC = () => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState({ title: '', content: '', tag: 'work' });
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    productivityService.getNotes().then(setNotes);
  }, []);

  const createNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.content.trim()) return;
    const note = await productivityService.createNote({
      ...draft,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setNotes((current) => [note, ...current]);
    setDraft({ title: '', content: '', tag: 'work' });
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('notes.title')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('notes.subtitle')}
          </p>
        </div>
        <Button icon={Plus} type="button" onClick={() => setCreateOpen(true)}>
          {t('notes.newNote')}
        </Button>
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title={t('notes.newNote')}>
        <form onSubmit={createNote} className="space-y-4">
          <Input
            label={t('notes.noteTitle')}
            placeholder={t('notes.noteTitle')}
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            required
          />
          <Textarea
            label={t('notes.note')}
            placeholder={t('notes.note')}
            rows={4}
            value={draft.content}
            onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
            required
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('notes.addNote')}</Button>
          </div>
        </form>
      </Modal>

      {notes.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {notes.map((note) => (
            <Card key={note.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">{note.title}</h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{note.content}</p>
                </div>
                <span className="w-fit rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{note.tag}</span>
              </div>
              <div className="mt-3 text-xs text-gray-500">{note.createdAt}</div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={StickyNote}
          title={t('notes.emptyTitle')}
          description={t('notes.emptyDescription')}
        />
      )}
    </div>
  );
};

export default NotesPage;
