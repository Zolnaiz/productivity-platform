/**
 * Escaping for the files the floor plan hands out.
 *
 * A zone name is typed by a person and can contain a quote, a comma or an
 * angle bracket. The label sheet is printed through `document.write` and the
 * registers are CSV, so both need their own escaping — without it a zone
 * called `5" pipe store` breaks the column it is in.
 */
export const escapeHtml = (value: string | number | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const escapeCsvCell = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export type AuditWalkStatus = 'overdue' | 'due_today' | 'upcoming' | 'scheduled';
