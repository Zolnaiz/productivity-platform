import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const user = request.user;
    const now = Date.now();

    // Log request
    this.logger.log(
      `Request: ${method} ${url} - User: ${user?.id || 'anonymous'} - Body: ${JSON.stringify(body)}`
    );

    return next
      .handle()
      .pipe(
        tap({
          next: () => {
            const response = context.switchToHttp().getResponse();
            this.logger.log(
              `Response: ${method} ${url} - Status: ${response.statusCode} - Duration: ${Date.now() - now}ms`
            );
          },
          error: (error) => {
            this.logger.error(
              `Error: ${method} ${url} - Status: ${error.status || 500} - Message: ${error.message}`
            );
          },
        }),
      );
  }
}
