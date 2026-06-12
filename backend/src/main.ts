import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import * as morgan from 'morgan';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

const toBoolean = (value: unknown) => value === true || String(value).toLowerCase() === 'true';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';
  const enableSwagger = !isProduction || toBoolean(configService.get('ENABLE_SWAGGER'));
  const corsOrigins = configService
    .get<string>('CORS_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
    }),
  );
  app.use(compression());

  if (nodeEnv === 'development') {
    app.use(morgan('dev'));
  }

  app.enableCors({
    origin: corsOrigins.length
      ? corsOrigins
      : isProduction
        ? false
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Device-Id',
      'X-App-Version',
      'X-Platform',
    ],
    exposedHeaders: ['Content-Disposition'],
  });

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
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());
  app.setGlobalPrefix('api');

  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Productivity Platform API')
      .setDescription('Productivity Platform REST API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('operations', 'Projects, tasks, work logs, audits, assessments, and expenses')
      .addTag('system', 'System health and configuration')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
      customSiteTitle: 'Productivity Platform API Documentation',
      customfavIcon: '/favicon.ico',
    });
  }

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log('==========================================');
  console.log('Productivity Platform Backend Started');
  console.log(`Environment: ${nodeEnv}`);
  console.log(`API Server: http://localhost:${port}`);
  console.log(`API Documentation: ${enableSwagger ? `http://localhost:${port}/api/docs` : 'disabled'}`);
  console.log(`Database: ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}`);
  console.log('==========================================');

  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
