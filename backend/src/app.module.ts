import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { configuration } from './shared/config/configuration';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { QuestionnairesModule } from './questionnaires/questionnaires.module';
import { ResponsesModule } from './responses/responses.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ReportsModule } from './reports/reports.module';
import { DatabaseModule } from './shared/database/database.module';
import { SeedModule } from './shared/seed/seed.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.development', '.env.production'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60),
          limit: config.get('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // Database
    DatabaseModule,

    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRATION', '7d'),
          issuer: 'productivity-platform',
          audience: 'productivity-users',
        },
      }),
      inject: [ConfigService],
    }),

    // Scheduled tasks
    ScheduleModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    QuestionnairesModule,
    ResponsesModule,
    ExpensesModule,
    ReportsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}