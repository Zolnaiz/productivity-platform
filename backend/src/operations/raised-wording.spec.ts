import { readFileSync } from 'fs';
import { join } from 'path';
import en from '../../../admin-web/src/i18n/locales/en';
import mn from '../../../admin-web/src/i18n/locales/mn';
import { RAISED_WORDING, wordRaised } from './raised-wording';

/** `{ a: { b: 'x' } }` as `{ 'raised.a.b': 'x' }`, the way i18next reads it. */
const flatten = (value: unknown, prefix: string): Record<string, string> =>
  typeof value === 'string'
    ? { [prefix]: value }
    : Object.entries(value as Record<string, unknown>).reduce(
        (all, [key, inner]) => ({ ...all, ...flatten(inner, `${prefix}.${key}`) }),
        {},
      );

/** The phone's copy, read out of its Dart source. */
const mobileWording = (name: '_raisedEn' | '_raisedMn') => {
  const source = readFileSync(
    join(__dirname, '../../../mobile-flutter/lib/utils/phase_one_strings.dart'),
    'utf8',
  ).replace(/\r\n/g, '\n');
  const block = source.slice(source.indexOf(`const ${name} = {`), source.indexOf('};', source.indexOf(`const ${name} = {`)));
  const entries: Record<string, string> = {};

  // A key, then one or more adjacent string literals, as dart format splits
  // a long line.
  for (const match of block.matchAll(/'(raised\.[\w.]+)':\s*((?:'(?:[^'\\]|\\.)*'\s*)+),/g)) {
    entries[match[1]] = [...match[2].matchAll(/'((?:[^'\\]|\\.)*)'/g)]
      .map((part) => part[1])
      .join('')
      .replace(/\\n/g, '\n');
  }

  return entries;
};

/**
 * The server, the web and the phone each word the same keys. An email that
 * says something the inbox does not is how people learn to ignore one of
 * them, so the three copies are held together here.
 */
describe('raised wording', () => {
  it('matches the web, word for word', () => {
    expect(RAISED_WORDING.en).toEqual(flatten(en.raised, 'raised'));
    expect(RAISED_WORDING.mn).toEqual(flatten(mn.raised, 'raised'));
  });

  it('matches the phone, word for word', () => {
    expect(RAISED_WORDING.en).toEqual(mobileWording('_raisedEn'));
    expect(RAISED_WORDING.mn).toEqual(mobileWording('_raisedMn'));
  });

  it('fills the parts in, and falls back to the stored sentence without a language', () => {
    expect(wordRaised('raised.dueOn', { date: '2026-09-28' }, 'mn', 'Due 2026-09-28')).toBe('2026-09-28-нд дуусна');
    expect(wordRaised('raised.dueOn', { date: '2026-09-28' }, undefined, 'Due 2026-09-28')).toBe('Due 2026-09-28');
    expect(wordRaised(undefined, {}, 'mn', 'Typed by hand')).toBe('Typed by hand');
  });
});
