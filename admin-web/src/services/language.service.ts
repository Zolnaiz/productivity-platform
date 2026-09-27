import { isDemoMode, patch } from './api';

/**
 * Tells the server which language this person reads in.
 *
 * The browser keeps the choice for itself; the server needs it for the one
 * thing a browser cannot do - write their email. Best effort: the switch has
 * already happened on screen, and failing to remember it must not undo that.
 */
export const rememberLanguage = async (language: string) => {
  try {
    if (isDemoMode() || !localStorage.getItem('token')) return;
    await patch('/users/profile/me', { language: language.split('-')[0].toLowerCase() });
  } catch {
    // The next choice will try again.
  }
};
