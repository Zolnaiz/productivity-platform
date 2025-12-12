import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';

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
        synchronize: config.get('DB_SYNCHRONIZE', false),
        logging: config.get('DB_LOGGING', false),
        migrations: [__dirname + '/../../migrations/**/*{.ts,.js}'],
        migrationsRun: config.get('DB_MIGRATIONS_RUN', false),
        ssl: config.get('DB_SSL', false),
        extra: config.get('DB_SSL', false)
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