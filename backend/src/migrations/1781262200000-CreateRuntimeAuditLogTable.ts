import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A record of who changed what.
 *
 * The screen for this existed long before the table did, filled from browser
 * storage — which is to say it showed the reader entries the reader could edit,
 * about actions nobody had taken. For a system used to run audits, that is
 * worse than having no page at all.
 *
 * The table is append-only. There is no `updatedAt` and no `deletedAt`, and
 * nothing in the application updates or deletes a row.
 *
 * Named `Runtime` because the loader's glob only applies `*Runtime*` and
 * `*Operations*` migrations; a file matching neither is silently never run.
 */
export class CreateRuntimeAuditLogTable1781262200000 implements MigrationInterface {
  name = 'CreateRuntimeAuditLogTable1781262200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_log_entries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id varchar NOT NULL,
        actor_id varchar,
        actor_name varchar,
        actor_role varchar,
        module varchar NOT NULL,
        action varchar NOT NULL,
        target_id varchar,
        method varchar NOT NULL,
        route varchar NOT NULL,
        status_code int NOT NULL,
        severity varchar NOT NULL DEFAULT 'info',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // The only query the application makes: one organization's entries, newest
    // first. The composite index serves both the filter and the ordering.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_audit_log_entries_organization_created
       ON audit_log_entries (organization_id, created_at DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_log_entries`);
  }
}
