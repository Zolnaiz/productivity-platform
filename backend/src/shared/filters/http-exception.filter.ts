import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, errorMessageFor } from '../errors/api-error';

/** Fallback classification for exceptions thrown without a code. */
const codeForStatus = (status: number): ErrorCode => {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.ValidationFailed;
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.AuthTokenInvalid;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.AccessDenied;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.ResourceNotFound;
    default:
      return ErrorCode.InternalError;
  }
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestIdHeader = request.headers?.['x-request-id'];
    const requestId = Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = errorMessageFor(ErrorCode.InternalError);
    let errorCode: ErrorCode = ErrorCode.InternalError;
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseData = exception.getResponse();

      if (typeof responseData === 'string') {
        message = responseData;
      } else if (typeof responseData === 'object') {
        message = (responseData as any).message || message;
        errors = (responseData as any).errors;
      }

      // A coded error names its own failure. Anything else — a bare Nest
      // exception, a class-validator rejection — is classified by status, so
      // clients always get a code to translate even from code we do not own.
      errorCode = (responseData as any)?.errorCode ?? codeForStatus(status);
    }

    // Log the error
    this.logger.error(
      `HTTP ${status} - ${exception instanceof Error ? exception.message : message} - ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Send response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errorCode,
      errors,
      requestId: typeof requestId === 'string' ? requestId : undefined,
    });
  }
}
