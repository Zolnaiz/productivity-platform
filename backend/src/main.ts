import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as morgan from 'morgan';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Logging middleware
  if (configService.get('NODE_ENV') === 'development') {
    app.use(morgan('dev'));
  }

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGINS')?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://10.0.2.2:3000',
      'http://10.0.2.2:8080',
    ],
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

  // Global pipes
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

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Productivity Platform API')
    .setDescription('Бүтээмж үнэлгээний платформын REST API документаци')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Аутентикаци, бүртгэл')
    .addTag('users', 'Хэрэглэгчийн менежмент')
    .addTag('organizations', 'Байгууллагын менежмент')
    .addTag('questionnaires', 'Асуулгын менежмент')
    .addTag('responses', 'Хариултын менежмент')
    .addTag('expenses', 'Зардлын менежмент')
    .addTag('reports', 'Тайлангийн менежмент')
    .addTag('system', 'Системийн тохиргоо')
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

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log('🚀 ==========================================');
  console.log('🚀 Productivity Platform Backend Started');
  console.log(`🚀 Environment: ${configService.get('NODE_ENV')}`);
  console.log(`🚀 API Server: http://localhost:${port}`);
  console.log(`🚀 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🚀 Database: ${configService.get('DB_HOST')}:${configService.get('DB_PORT')}`);
  console.log('🚀 ==========================================');

  // Graceful shutdown
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