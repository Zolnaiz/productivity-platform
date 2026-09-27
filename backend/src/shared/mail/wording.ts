/**
 * Wording a message for somebody outside the product.
 *
 * A screen words a key in the language its reader chose. An email has no
 * reader to ask, so it goes out in the organization's own language - the one
 * its settings name, which is Mongolian for every workspace registered here -
 * and in the stored English sentence when the organization names none.
 */
export type MailLanguage = 'mn' | 'en';

export const mailLanguageOf = (settings?: Record<string, unknown> | null): MailLanguage | undefined => {
  const language = typeof settings?.language === 'string' ? settings.language.toLowerCase() : '';

  if (language.startsWith('mn')) return 'mn';
  if (language.startsWith('en')) return 'en';
  return undefined;
};

/** Fills `{{name}}` from the parts, leaving any part it was not given. */
export const interpolate = (template: string, params: Record<string, unknown> = {}) =>
  template.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) =>
    params[name] === undefined || params[name] === null ? placeholder : String(params[name]),
  );
