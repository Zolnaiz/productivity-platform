import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './shared/database/database.module';
import { OperationsModule } from './operations/operations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
        PORT: Joi.number().default(3000),
        CORS_ORIGINS: Joi.string().allow('').default(''),
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().default('postgres'),
        DB_PASSWORD: Joi.string().allow('').default('postgres'),
        DB_DATABASE: Joi.string().default('questionnaire_db'),
        DB_SYNCHRONIZE: Joi.boolean().truthy('true').falsy('false').default(false),
        DB_LOGGING: Joi.boolean().truthy('true').falsy('false').default(false),
        DB_MIGRATIONS_RUN: Joi.boolean().truthy('true').falsy('false').default(false),
        DB_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
        JWT_SECRET: Joi.string().when('NODE_ENV', {
          is: 'production',
          then: Joi.required(),
          otherwise: Joi.string().default('dev-secret-change-me'),
        }),
        ENABLE_SWAGGER: Joi.boolean().truthy('true').falsy('false').default(false),
        ALLOW_PUBLIC_OPERATIONS: Joi.boolean().truthy('true').falsy('false').default(false),
      }),
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    OperationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
