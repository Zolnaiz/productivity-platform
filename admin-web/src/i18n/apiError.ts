import type { TFunction } from 'i18next';

/**
 * Turns a failed API call into a sentence in the user's language.
 *
 * The API answers with an `errorCode` — a stable identifier, never prose — and
 * the wording lives in `locales/*.ts` under `errors.<CODE>`. That keeps the
 * server out of the translation business: it does not need to know, or guess,
 * which language the browser is in.
 *
 * Falls back in three steps, so a user never sees a raw code or a blank toast:
 * the code we were given, then a code inferred from the HTTP status, then a
 * generic message.
 */

/** Fallback classification, mirroring the backend's own status mapping. */
const codeForStatus = (status?: number): string => {
  switch (status) {
    case 400:
    case 422:
      return 'VALIDATION_FAILED';
    case 401:
      return 'AUTH_TOKEN_INVALID';
    case 403:
      return 'ACCESS_DENIED';
    case 404:
      return 'RESOURCE_NOT_FOUND';
    case 500:
    case 502:
    case 503:
      return 'INTERNAL_ERROR';
    default:
      return 'unknown';
  }
};

interface ApiErrorShape {
  response?: {
    status?: number;
    data?: {
      errorCode?: string;
      message?: string;
    };
  };
  code?: string;
}

/** The API's code for this failure, or a status-derived stand-in. */
export const errorCodeOf = (error: unknown): string => {
  const candidate = error as ApiErrorShape | null | undefined;

  // No response at all: the request never reached the server.
  if (candidate && !candidate.response) {
    return 'offline';
  }

  return candidate?.response?.data?.errorCode || codeForStatus(candidate?.response?.status);
};

/**
 * The message to show the user.
 *
 * `t` returns the key itself when it is missing, which is how an unrecognised
 * code — an older client against a newer API — falls through to the generic
 * message instead of printing `AUTH_SOMETHING_NEW` at the user.
 */
export const apiErrorMessage = (error: unknown, t: TFunction): string => {
  const code = errorCodeOf(error);
  const key = `errors.${code}`;
  const translated = t(key);

  return translated === key ? t('errors.unknown') : translated;
};
