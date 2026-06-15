import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'refreshToken', 'jwt'];

export const redactSensitiveData = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
      const normalizedKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sensitiveKey) => normalizedKey.includes(sensitiveKey.toLowerCase()));
      return [key, isSensitive ? '[REDACTED]' : redactSensitiveData(nestedValue)];
    }),
  );
};

export const resolveRequestId = (headerValue: unknown) => {
  const requestId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return typeof requestId === 'string' && requestId.trim() ? requestId.trim() : randomUUID();
};

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body } = request;
    const user = request.user;
    const requestId = resolveRequestId(request.headers?.['x-request-id']);
    const now = Date.now();

    response.setHeader?.('X-Request-Id', requestId);
    const safeBody = redactSensitiveData(body);

    this.logger.log(
      JSON.stringify({
        event: 'http_request',
        requestId,
        method,
        url,
        userId: user?.id || 'anonymous',
        body: safeBody,
      }),
    );

    return next
      .handle()
      .pipe(
        tap({
          next: () => {
            this.logger.log(
              JSON.stringify({
                event: 'http_response',
                requestId,
                method,
                url,
                statusCode: response.statusCode,
                durationMs: Date.now() - now,
              }),
            );
          },
          error: (error) => {
            this.logger.error(
              JSON.stringify({
                event: 'http_error',
                requestId,
                method,
                url,
                statusCode: error.status || 500,
                message: error.message,
                durationMs: Date.now() - now,
              }),
            );
          },
        }),
      );
  }
}
