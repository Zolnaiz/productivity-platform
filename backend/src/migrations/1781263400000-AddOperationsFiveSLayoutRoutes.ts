import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Somewhere to keep a spaghetti diagram.
 *
 * The plan has known its scale and its walls for a while, so measuring the
 * path a person takes through an area is arithmetic rather than a drawing
 * exercise. What was missing was somewhere to put the path: routes drawn on a
 * plan had nowhere to be stored, so the oldest tool in this trade could not be
 * used at all.
 */
export class AddFiveSLayoutRoutes1781263400000 implements MigrationInterface {
  name = 'AddFiveSLayoutRoutes1781263400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS routes jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS routes`);
  }
}
