import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Every failure this API can report to a client, as a stable identifier.
 *
 * The client picks the wording. The API only says which failure happened, so a
 * Mongolian browser and an English one can describe the same 401 differently
 * without the server knowing anything about either language.
 *
 * These strings are part of the API contract: rename one and every client that
 * matched on it stops recognising the error. Add new codes freely; change an
 * existing one only alongside the clients that read it.
 */
export const ErrorCode = {
  AuthInvalidCredentials: 'AUTH_INVALID_CREDENTIALS',
  AuthAccountInactive: 'AUTH_ACCOUNT_INACTIVE',
  AuthEmailTaken: 'AUTH_EMAIL_TAKEN',
  AuthUserNotFound: 'AUTH_USER_NOT_FOUND',
  AuthSessionExpired: 'AUTH_SESSION_EXPIRED',
  AuthTokenInvalid: 'AUTH_TOKEN_INVALID',
  AuthTokenMissing: 'AUTH_TOKEN_MISSING',
  AuthOrganizationRequired: 'AUTH_ORGANIZATION_REQUIRED',
  AccessDenied: 'ACCESS_DENIED',
  ResourceNotFound: 'RESOURCE_NOT_FOUND',
  ValidationFailed: 'VALIDATION_FAILED',
  MetricsDisabled: 'METRICS_DISABLED',
  InternalError: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

type HttpExceptionConstructor = new (body: Record<string, unknown>) => HttpException;

interface ErrorDefinition {
  /** Decides the HTTP status; Nest derives it from the class. */
  readonly exception: HttpExceptionConstructor;
  /**
   * English fallback, for clients that do not recognise the code and for logs.
   * Never the primary channel — `errorCode` is.
   */
  readonly message: string;
}

const definitions: Record<ErrorCode, ErrorDefinition> = {
  [ErrorCode.AuthInvalidCredentials]: {
    exception: UnauthorizedException,
    message: 'Invalid email or password',
  },
  [ErrorCode.AuthAccountInactive]: {
    exception: ForbiddenException,
    message: 'This account is inactive',
  },
  [ErrorCode.AuthEmailTaken]: {
    exception: ConflictException,
    message: 'This email is already registered',
  },
  [ErrorCode.AuthUserNotFound]: {
    exception: UnauthorizedException,
    message: 'User not found',
  },
  [ErrorCode.AuthSessionExpired]: {
    exception: UnauthorizedException,
    message: 'Session expired, sign in again',
  },
  [ErrorCode.AuthTokenInvalid]: {
    exception: UnauthorizedException,
    message: 'Invalid or expired token',
  },
  [ErrorCode.AuthTokenMissing]: {
    exception: UnauthorizedException,
    message: 'Authorization token is required',
  },
  [ErrorCode.AuthOrganizationRequired]: {
    exception: UnauthorizedException,
    message: 'Organization context is required',
  },
  [ErrorCode.AccessDenied]: {
    exception: ForbiddenException,
    message: 'You do not have access to this resource',
  },
  [ErrorCode.ResourceNotFound]: {
    exception: NotFoundException,
    message: 'The requested record was not found',
  },
  [ErrorCode.ValidationFailed]: {
    exception: BadRequestException,
    message: 'The submitted data is not valid',
  },
  [ErrorCode.MetricsDisabled]: {
    exception: NotFoundException,
    message: 'Metrics endpoint is disabled',
  },
  [ErrorCode.InternalError]: {
    exception: InternalServerErrorException,
    message: 'Internal server error',
  },
};

/**
 * Builds the exception for a code.
 *
 * Returns the concrete Nest exception class rather than one shared subclass, so
 * the status stays where Nest expects it and `instanceof UnauthorizedException`
 * keeps working in guards and tests.
 *
 * `details` appends to the English fallback only — a record name, a field. The
 * code is what the client translates, so anything in `details` must be data
 * (a name, an id), never a sentence the user is expected to read.
 */
export const apiError = (code: ErrorCode, details?: string): HttpException => {
  const definition = definitions[code];
  const message = details ? `${definition.message}: ${details}` : definition.message;

  return new definition.exception({ message, errorCode: code });
};

/** The English fallback for a code, for tests and logs. */
export const errorMessageFor = (code: ErrorCode): string => definitions[code].message;
