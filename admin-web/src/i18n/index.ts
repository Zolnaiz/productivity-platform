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

export default i18n;
