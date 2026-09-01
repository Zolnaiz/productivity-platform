import React, { useEffect, useState } from 'react';
import { StickyNote } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import { productivityService } from '../services/productivity.service';
import { Note } from '../types/productivity.types';

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState({ title: '', content: '', tag: 'work' });

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
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notes</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Ажлын тэмдэглэл, meeting note, report idea, blocker-уудаа хадгална.
        </p>
      </div>

      <Card title="New note">
        <form onSubmit={createNote} className="grid items-end gap-3 lg:grid-cols-5">
          <Input
            label="Title"
            placeholder="Title"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
          <Input
            className="lg:col-span-3"
            label="Note"
            placeholder="Note"
            value={draft.content}
            onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
          />
          <Button type="submit">Add note</Button>
        </form>
      </Card>

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
          title="No notes yet"
          description="Capture meeting notes, project context, blockers, and report ideas so they can feed future summaries."
        />
      )}
    </div>
  );
};

export default NotesPage;
