import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Photographs and documents attached to 5S records.
 *
 * The bytes live on disk under `storage_key`, which the server generates; the
 * row keeps the name a person recognises. `owner_id` is a plain column and not
 * a foreign key because red tag and zone ids live in the floor plan's JSON.
 *
 * Timestamp columns are quoted camelCase to match `BaseEntity`, which declares
 * them without an explicit column name and so takes the property name as-is.
 */
export class CreateOperationsAttachmentsTable1781261800000 implements MigrationInterface {
  name = 'CreateOperationsAttachmentsTable1781261800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id varchar,
        owner_type varchar NOT NULL,
        owner_id varchar NOT NULL,
        kind varchar NOT NULL DEFAULT 'evidence',
        file_name varchar NOT NULL,
        storage_key varchar NOT NULL,
        mime_type varchar NOT NULL,
        size_bytes integer NOT NULL,
        uploaded_by varchar,
        caption text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_attachments_organization_id ON attachments (organization_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_attachments_owner ON attachments (owner_type, owner_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS attachments`);
  }
}
