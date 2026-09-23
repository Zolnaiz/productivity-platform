import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Attachment } from '../src/operations/entities/attachment.entity';
import { createAttachmentStore } from '../src/operations/attachment-store';

config();

/**
 * Checks that every attachment row still has its bytes.
 *
 * A 5S programme's evidence is its photographs, and the row and the bytes live
 * in different places: the row is in PostgreSQL and goes into the database
 * backup, the bytes are on a volume or in a bucket and do not. A restore that
 * brings back the rows without the files looks entirely healthy — the counts
 * match, the pages render, every red tag says it has a photograph — until
 * somebody opens one.
 *
 * So this is the check the restore runbook needs and did not have. It answers
 * one question per row, with `exists` rather than a read, so a store with
 * thousands of photographs is not pulled through this process to answer it.
 *
 * What it deliberately does not do is look for objects with no row. Those are
 * untidy rather than incorrect — the row is the record — and listing an entire
 * bucket to find them is a different and much more expensive question.
 *
 * Run it against the environment the application uses: the same DB_* and
 * ATTACHMENT_STORE settings, so it checks the store the application will
 * actually serve from.
 */

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'questionnaire_db',
  ssl: String(process.env.DB_SSL).toLowerCase() === 'true',
  entities: [Attachment],
  synchronize: false,
  logging: false,
});

/** The application's own factory, reading the environment as the app reads it. */
const store = createAttachmentStore({
  get: (key: string) => process.env[key],
} as never);

const run = async () => {
  await dataSource.initialize();

  const rows = await dataSource.getRepository(Attachment).find({
    order: { createdAt: 'ASC' },
  });

  const missing: Attachment[] = [];

  for (const row of rows) {
    if (!(await store.exists(row.storageKey))) {
      missing.push(row);
    }
  }

  await dataSource.destroy();

  console.log(`Store: ${store.describe()}`);
  console.log(`Attachment rows: ${rows.length}`);

  if (!missing.length) {
    console.log('Every attachment row has its bytes.');
    return;
  }

  console.error(`Missing bytes for ${missing.length} attachment(s):`);

  for (const row of missing) {
    // Enough to find the record this evidence belonged to, without printing
    // the whole row: the owner is what somebody has to go and look at.
    console.error(
      `  ${row.id}  ${row.ownerType} ${row.ownerId}  ${row.kind}  ${row.fileName}  ${row.storageKey}`,
    );
  }

  process.exitCode = 1;
};

run().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);

  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }

  process.exitCode = 1;
});
