import { describe, expect, it } from 'vitest';
import { raisedTitle, RaisedText } from './raisedText';

/** A translator that behaves the way i18next does for these calls. */
const translator = (phrases: Record<string, string>) =>
  ((key: string, options?: Record<string, unknown>) => {
    const phrase = phrases[key];

    if (phrase === undefined) return (options?.defaultValue as string) ?? key;

    return phrase.replace(/\{\{(\w+)\}\}/g, (_, name) => String(options?.[name] ?? ''));
  }) as unknown as Parameters<typeof raisedTitle>[1];

const t = translator({
  'raised.tierAuditDue': '{{layer}} 5S аудит хийх хугацаа: {{place}}',
});

const raised = (over: Partial<RaisedText> = {}): RaisedText => ({
  title: 'Operator 5S audit due: A03 - Storage',
  titleKey: 'raised.tierAuditDue',
  titleParams: { layer: 'Оператор', place: 'A03 - Storage' },
  ...over,
});

describe('what a raised piece of work says to the person reading it', () => {
  it('words the key where somebody is reading, not where it was raised', () => {
    // The whole point: a Mongolian workspace was shown an English sentence the
    // server had assembled, and no translation could reach it.
    expect(raisedTitle(raised(), t)).toBe('Оператор 5S аудит хийх хугацаа: A03 - Storage');
  });

  it('shows what somebody typed, untouched', () => {
    // Most tasks. Their own words need no translating.
    expect(raisedTitle({ title: 'Fix the gate latch' }, t)).toBe('Fix the gate latch');
  });

  it('falls back to the sentence when the key is one this client has never heard of', () => {
    // A server a version ahead. Printing the key itself at somebody is worse
    // than printing a sentence in the wrong language.
    expect(raisedTitle(raised({ titleKey: 'raised.somethingNewer' }), t)).toBe(
      'Operator 5S audit due: A03 - Storage',
    );
  });

  it('survives a key with no parts at all', () => {
    expect(raisedTitle({ title: 'Something', titleKey: 'raised.tierAuditDue' }, t)).toBe(
      ' 5S аудит хийх хугацаа: ',
    );
  });
});
