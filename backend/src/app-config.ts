import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { MetricsInterceptor } from './shared/metrics/metrics.interceptor';
import { MetricsService } from './shared/metrics/metrics.service';
import { withAuditContext } from './audit/audit-context';

/**
 * The prefix every route sits under.
 *
 * Exported because Express reports `request.route.path` with this prefix
 * included, so anything reading a route back — the audit log does — has to
 * strip the same string this sets. Hardcoding it in both places is how they
 * come to disagree.
 */
export const API_PREFIX = 'api';

/**
 * How a request is handled before and after a controller sees it.
 *
 * This lives apart from `bootstrap` so a test can build the application the
 * way production builds it. It matters most for the validation pipe:
 * `forbidNonWhitelisted` is what turns a request carrying `role` into a 400
 * rather than a field quietly dropped, and that behaviour belongs to this
 * configuration rather than to any DTO. A test that configured its own pipe
 * would be testing its own copy.
 *
 * The network-facing setup — helmet, CORS, compression, Swagger, the port —
 * stays in `main.ts`, because none of it changes how a handler behaves.
 */
export const configureRequestHandling = (app: INestApplication, metrics: MetricsService) => {
  /*
    Every request runs inside an audit context, so a service can hand over the
    values it is about to overwrite without knowing a request exists.

    Here rather than as a Nest middleware class: this is the one place both the
    application and the HTTP specs build their request handling, and an audit
    trail that is complete in production and empty in the tests proving it is
    complete is worth nothing. It has to wrap the handler, which an
    interceptor cannot do — Nest subscribes to an interceptor's observable
    after the scope opened inside it has closed.
  */
  app.use((_request: unknown, _response: unknown, next: () => void) => withAuditContext(next));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
    new MetricsInterceptor(metrics),
  );
  app.setGlobalPrefix(API_PREFIX);

  return app;
};
