import type { TFunction } from 'i18next';

/** Anything the server raised: a task, a notification, or a row of either. */
export interface RaisedText {
  title: string;
  titleKey?: string;
  titleParams?: Record<string, string | number>;
}

/**
 * What a raised piece of work says, in the reader's language.
 *
 * The server assembles "Tier 1 5S audit due: A03 - Storage" and stores it, and
 * that sentence is what a CSV export and an email show — they have no reader
 * to ask. A screen does: it also gets the key and the parts, and words them
 * where somebody is reading.
 *
 * Falls back to the stored sentence for everything else, which is most tasks:
 * somebody typing their own work needs no translating, and a task raised
 * before this existed carries no key.
 *
 * The key is deliberately resolved without a default, so a key the client has
 * never heard of — a server one version ahead — falls back to the sentence it
 * came with rather than printing the key itself at somebody.
 */
export const raisedTitle = (item: RaisedText, t: TFunction): string => {
  if (!item.titleKey) return item.title;

  const worded = t(item.titleKey, { ...(item.titleParams ?? {}), defaultValue: '' });

  return worded || item.title;
};
