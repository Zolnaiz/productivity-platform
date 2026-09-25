import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { apiError, ErrorCode, errorMessageFor } from './api-error';

describe('apiError', () => {
  it('carries the code in the response body so clients can translate it', () => {
    const error = apiError(ErrorCode.AuthInvalidCredentials);

    expect(error.getResponse()).toEqual({
      message: 'Invalid email or password',
      errorCode: 'AUTH_INVALID_CREDENTIALS',
    });
  });

  it('returns the concrete Nest exception, so guards and status mapping keep working', () => {
    expect(apiError(ErrorCode.AuthInvalidCredentials)).toBeInstanceOf(UnauthorizedException);
    expect(apiError(ErrorCode.AuthAccountInactive)).toBeInstanceOf(ForbiddenException);
    expect(apiError(ErrorCode.AuthEmailTaken)).toBeInstanceOf(ConflictException);
    expect(apiError(ErrorCode.ResourceNotFound)).toBeInstanceOf(NotFoundException);
    expect(apiError(ErrorCode.ValidationFailed)).toBeInstanceOf(BadRequestException);
  });

  it('maps each code to the status its meaning implies', () => {
    expect(apiError(ErrorCode.AuthInvalidCredentials).getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(apiError(ErrorCode.AuthAccountInactive).getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(apiError(ErrorCode.AuthEmailTaken).getStatus()).toBe(HttpStatus.CONFLICT);
    expect(apiError(ErrorCode.MetricsDisabled).getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(apiError(ErrorCode.InternalError).getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('appends details to the English fallback without touching the code', () => {
    const error = apiError(ErrorCode.ResourceNotFound, 'Project');

    expect(error.getResponse()).toEqual({
      message: 'The requested record was not found: Project',
      errorCode: 'RESOURCE_NOT_FOUND',
    });
  });

  it('defines every declared code, so no code can reach a client undefined', () => {
    for (const code of Object.values(ErrorCode)) {
      expect(errorMessageFor(code)).toEqual(expect.any(String));
      expect(errorMessageFor(code).length).toBeGreaterThan(0);
    }
  });
});
