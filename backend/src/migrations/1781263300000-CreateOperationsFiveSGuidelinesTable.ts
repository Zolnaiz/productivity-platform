import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Somewhere for a 5S programme's own registers to live.
 *
 * The improvement record, the red-tag implementation cards, the assessment
 * scores and the checklist progress were kept in the browser that typed them.
 * A 5S improvement register is the memory of a programme — what was found, who
 * decided what, whether it worked — and that memory was being lost with every
 * new laptop and shared with nobody.
 *
 * One row per organization, with the standard and the records in separate
 * columns: they are written by different people at different rates, and a
 * single document would have an operator's checklist tick overwriting an
 * administrator's edit of the standard.
 */
export class CreateFiveSGuidelinesTable1781263300000 implements MigrationInterface {
  name = 'CreateFiveSGuidelinesTable1781263300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS five_s_guidelines (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        organization_id varchar,
        content jsonb NOT NULL DEFAULT '{}'::jsonb,
        records jsonb NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_five_s_guidelines_organization ON five_s_guidelines (organization_id)`,
    );
    // One register per organization. Without this, two tabs saving at once
    // leave two rows and the programme's memory splits in half.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_five_s_guidelines_one_per_organization
      ON five_s_guidelines (organization_id)
      WHERE organization_id IS NOT NULL AND deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS five_s_guidelines`);
  }
}
