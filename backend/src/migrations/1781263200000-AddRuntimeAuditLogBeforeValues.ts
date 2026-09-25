import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * What a value was before the change.
 *
 * The trail could say that somebody set an area's audit frequency to monthly
 * and never what it was before, because an interceptor sees the request and
 * the response and not the row. The services that make these changes already
 * load the record first, so they hand over what they are about to overwrite
 * and this is where it lands.
 *
 * Nullable rather than defaulted: a creation has no before, and pretending it
 * has an empty one would make an empty object mean two different things.
 */
export class AddRuntimeAuditLogBeforeValues1781263200000 implements MigrationInterface {
  name = 'AddRuntimeAuditLogBeforeValues1781263200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE audit_log_entries ADD COLUMN IF NOT EXISTS before_values jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE audit_log_entries DROP COLUMN IF EXISTS before_values`);
  }
}
