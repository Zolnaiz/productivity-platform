import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { MetricsInterceptor } from './shared/metrics/metrics.interceptor';
import { MetricsService } from './shared/metrics/metrics.service';

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
