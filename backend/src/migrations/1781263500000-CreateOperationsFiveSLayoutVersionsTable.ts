import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * What a floor plan looked like on a given day.
 *
 * An audit from March scored the building as it stood in March, and the plan
 * is a living document: walls move, areas merge, zones are retired. Without a
 * record of the drawing, a score three months old is attached to a building
 * that no longer exists, and nobody can tell whether an area improved or was
 * simply redrawn.
 *
 * One snapshot per plan per day. The editor saves on a debounce, so a version
 * per save would be thousands of copies of a drawing that changed by a pixel,
 * and a day is the grain at which anybody actually asks the question.
 */
export class CreateFiveSLayoutVersionsTable1781263500000 implements MigrationInterface {
  name = 'CreateFiveSLayoutVersionsTable1781263500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS five_s_layout_versions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        organization_id varchar,
        layout_id varchar NOT NULL,
        taken_on date NOT NULL,
        taken_by varchar,
        label varchar,
        snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_five_s_layout_versions_organization ON five_s_layout_versions (organization_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_five_s_layout_versions_layout ON five_s_layout_versions (layout_id, taken_on DESC)`,
    );
    // The database is the arbiter of "one per day": two tabs saving at once
    // both pass a lookup, and two snapshots of the same day are noise.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_five_s_layout_versions_one_per_day
      ON five_s_layout_versions (layout_id, taken_on)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS five_s_layout_versions`);
  }
}
