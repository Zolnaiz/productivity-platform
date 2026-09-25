import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const toBoolean = (value: unknown, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'questionnaire_db',
  ssl: toBoolean(process.env.DB_SSL, false),
  entities: [],
  // Only the operations-platform migrations run. The two 1700000000xxx files
  // belong to the legacy questionnaire schema and are deliberately excluded.
  //
  // These are filename globs, so a migration whose name matches neither pattern
  // is silently never applied — which is how the 5S layout tables went missing
  // from every real database. Name new migrations *Operations* or *Runtime*.
  migrations: ['src/migrations/*Runtime*.ts', 'src/migrations/*Operations*.ts'],
  synchronize: false,
  logging: toBoolean(process.env.DB_LOGGING, false),
});
