import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * What changed, not only that something did.
 *
 * The trail recorded the actor, the route and the record, and a reader's first
 * question — what did they change? — had no answer in it. The column holds a
 * summary rather than the request: secrets keep their name and lose their
 * value, and anything too large to read is described instead. See
 * `change-summary.ts` for the rules, which are the reason this is safe to
 * keep at all.
 */
export class AddAuditLogChanges1781262700000 implements MigrationInterface {
  name = 'AddAuditLogChanges1781262700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE audit_log_entries ADD COLUMN IF NOT EXISTS changes jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE audit_log_entries DROP COLUMN IF EXISTS changes`);
  }
}
