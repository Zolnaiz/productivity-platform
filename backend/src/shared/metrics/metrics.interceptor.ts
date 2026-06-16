import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

const resolveRouteLabel = (request: any) => {
  const routePath = request.route?.path;
  const baseUrl = request.baseUrl || '';

  if (typeof routePath === 'string' && routePath) {
    return `${baseUrl}${routePath}` || routePath;
  }

  return String(request.path || request.url || 'unknown').split('?')[0];
};

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startedAt = Date.now();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      finalize(() => {
        this.metricsService.recordHttpRequest(
          request.method || 'UNKNOWN',
          resolveRouteLabel(request),
          response.statusCode || 500,
          Date.now() - startedAt,
        );
      }),
    );
  }
}
