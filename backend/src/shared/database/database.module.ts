import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

const toBoolean = (value: unknown, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_DATABASE', 'questionnaire_db'),
        entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
        synchronize: toBoolean(config.get('DB_SYNCHRONIZE'), false),
        logging: toBoolean(config.get('DB_LOGGING'), false),
        // The same rule as `migrations/data-source.ts`: only the Runtime and
        // Operations migrations. Everything in the folder matched before, so
        // running from source loaded the schema spec, the helpers and the two
        // legacy questionnaire migrations as if they were migrations; the
        // compiled build happened to leave them out, which is the only reason
        // production never met it.
        migrations: [
          __dirname + '/../../migrations/*Runtime*{.ts,.js}',
          __dirname + '/../../migrations/*Operations*{.ts,.js}',
        ],
        migrationsRun: toBoolean(config.get('DB_MIGRATIONS_RUN'), false),
        ssl: toBoolean(config.get('DB_SSL'), false),
        extra: toBoolean(config.get('DB_SSL'), false)
          ? {
              ssl: {
                rejectUnauthorized: false,
              },
            }
          : {},
        retryAttempts: 5,
        retryDelay: 3000,
        autoLoadEntities: true,
      }),
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}
