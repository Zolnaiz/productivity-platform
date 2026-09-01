import { beforeEach, describe, expect, it } from 'vitest';
import i18n, { changeLanguage, languageStorageKey, normalizeLanguage, supportedLanguages } from './index';
import en from './locales/en';
import mn from './locales/mn';

const flatten = (value: unknown, prefix = ''): string[] =>
  typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key))
    : [prefix];

describe('translations', () => {
  it('covers every English key in every other locale', () => {
    const reference = flatten(en).sort();

    expect(flatten(mn).sort()).toEqual(reference);
  });

  it('leaves no key untranslated', () => {
    const untranslated = flatten(en).filter((key) => {
      const read = (source: unknown) =>
        key.split('.').reduce<unknown>((value, part) => (value as Record<string, unknown>)?.[part], source);

      return read(en) === read(mn);
    });

    // A shared value is almost always a forgotten translation. Add the key here
    // only when the two languages genuinely use the same word.
    expect(untranslated).toEqual([]);
  });
});

describe('language selection', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('accepts both a locale tag and a short code', () => {
    expect(normalizeLanguage('mn-MN')).toBe('mn');
    expect(normalizeLanguage('en-US')).toBe('en');
    expect(normalizeLanguage('en')).toBe('en');
  });

  it('falls back to Mongolian for anything unsupported', () => {
    expect(normalizeLanguage('fr-FR')).toBe('mn');
    expect(normalizeLanguage(null)).toBe('mn');
    expect(normalizeLanguage('')).toBe('mn');
  });

  it('applies and remembers the chosen language', async () => {
    await changeLanguage('en-US');

    expect(i18n.language).toBe('en');
    expect(localStorage.getItem(languageStorageKey)).toBe('en');
    expect(i18n.t('nav.projects')).toBe(en.nav.projects);

    await changeLanguage('mn-MN');

    expect(i18n.t('nav.projects')).toBe(mn.nav.projects);
  });

  it('offers exactly the languages it can actually render', () => {
    expect([...supportedLanguages].sort()).toEqual(['en', 'mn']);
  });
});
