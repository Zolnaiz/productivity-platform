import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './shared/database/database.module';
import { OperationsModule } from './operations/operations.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MailModule } from './shared/mail/mail.module';
import { AuditModule } from './audit/audit.module';
import { AuditLogInterceptor } from './audit/audit-log.interceptor';
import { envValidationSchema } from './shared/config/env.validation';
import { MetricsService } from './shared/metrics/metrics.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development', '.env.production'],
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('RATE_LIMIT_TTL_MS', 60000),
            limit: config.get<number>('RATE_LIMIT_LIMIT', 120),
          },
        ],
      }),
    }),
    DatabaseModule,
    // Global, so an invitation from `auth` and a notification from
    // `operations` go out through the same configured transport.
    MailModule,
    AuditModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    OperationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MetricsService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      // Registered once, for every route. An audit trail assembled by
      // remembering to call a logger has invisible holes in it.
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
