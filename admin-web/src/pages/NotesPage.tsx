import React, { useEffect, useState } from 'react';
import Card from '../components/common/Card';
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
        <form onSubmit={createNote} className="grid gap-3 lg:grid-cols-5">
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Title"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 lg:col-span-3"
            placeholder="Note"
            value={draft.content}
            onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
          />
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white" type="submit">
            Add note
          </button>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {notes.map((note) => (
          <Card key={note.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">{note.title}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{note.content}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{note.tag}</span>
            </div>
            <div className="mt-3 text-xs text-gray-500">{note.createdAt}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NotesPage;
