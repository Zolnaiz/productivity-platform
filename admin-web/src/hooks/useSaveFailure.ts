import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { NotificationContext } from '../contexts/NotificationContext';
import { apiErrorMessage } from '../i18n/apiError';

/**
 * Says that something was not saved, and why, as the server put it.
 *
 * A dozen save handlers across the app awaited the server and caught
 * nothing: a refused note, a template, a workspace profile, a month's
 * review simply did not happen, with nothing on screen to say so. This is
 * the one toast they share.
 *
 * Quiet outside the notification provider rather than throwing, so a screen
 * rendered on its own in a test does not need the whole shell.
 */
export const useSaveFailure = () => {
  const { t } = useTranslation();
  const notifications = useContext(NotificationContext);

  return useCallback(
    (error: unknown) => {
      notifications?.addNotification({
        type: 'error',
        title: t('common.notSaved'),
        message: apiErrorMessage(error, t),
      });
    },
    [notifications, t],
  );
};
