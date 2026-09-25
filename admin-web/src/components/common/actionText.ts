import type { TFunction } from 'i18next';
import { ActionItem } from '../../types/action.types';
import { raisedTitle } from './raisedText';

/**
 * An action item's three lines in the reader's language, falling back to the
 * English each carries for a key this build does not know.
 */
export const actionText = (item: ActionItem, t: TFunction) => ({
  title: raisedTitle(item, t),
  message: raisedTitle({ title: item.message, titleKey: item.messageKey, titleParams: item.messageParams }, t),
  meta: item.metaKey
    ? t(item.metaKey, {
        ...(item.metaParams ?? {}),
        // A response's status is a word too, and gets the reader's.
        ...(item.metaParams?.status
          ? { status: t(`actions.status.${item.metaParams.status}`, { defaultValue: String(item.metaParams.status) }) }
          : {}),
        defaultValue: item.meta,
      })
    : item.meta,
  type: t(`actions.type.${item.type}`),
  priority: t(`actions.priority.${item.priority}`),
});
