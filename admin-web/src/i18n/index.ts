import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import mn from './locales/mn';

export const supportedLanguages = ['mn', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageStorageKey = 'app-language';

const isSupported = (value: string | null): value is SupportedLanguage =>
  Boolean(value) && (supportedLanguages as readonly string[]).includes(value as string);

/**
 * The workspace stores its language as a locale tag ('mn-MN'), while i18next
 * works in short codes. Accept either so a stored workspace setting and a
 * stored UI preference both resolve.
 */
export const normalizeLanguage = (value: string | null | undefined): SupportedLanguage => {
  const short = (value || '').split('-')[0].toLowerCase();
  return isSupported(short) ? short : 'mn';
};

const readStoredLanguage = (): SupportedLanguage => {
  try {
    return normalizeLanguage(localStorage.getItem(languageStorageKey));
  } catch {
    // Private mode or blocked storage: fall back to the default.
    return 'mn';
  }
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    mn: { translation: mn },
  },
  lng: readStoredLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export const changeLanguage = (value: string) => {
  const language = normalizeLanguage(value);

  try {
    localStorage.setItem(languageStorageKey, language);
  } catch {
    // Preference is not persisted, but the switch still applies this session.
  }

  return i18n.changeLanguage(language);
};

/**
 * The workspace's language, used for anybody who has not chosen their own.
 *
 * The settings page has let an administrator set it all along and nothing
 * read it, so every new reader got Mongolian whatever the workspace said. A
 * person's own choice, once made, is stored and wins; this never overwrites
 * it and never stores anything itself.
 */
export const applyWorkspaceLanguage = (value: string | null | undefined) => {
  if (!value) return;

  try {
    if (localStorage.getItem(languageStorageKey)) return;
  } catch {
    // Without storage there is no personal choice to respect.
  }

  const language = normalizeLanguage(value);
  if (i18n.language !== language) void i18n.changeLanguage(language);
};

export default i18n;
