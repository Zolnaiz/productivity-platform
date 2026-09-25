import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Which floor a plan is of.
 *
 * An organization had exactly one floor plan and a `site` that was a name
 * somebody typed on it. A real plant has buildings and floors, and a 5S score
 * for "the site" that mixes the machine shop with the offices upstairs is not
 * a score anybody can act on.
 *
 * The column is the small half of that change; the large half is that a
 * layout is no longer the organization's only one.
 */
export class AddFiveSLayoutFloor1781262800000 implements MigrationInterface {
  name = 'AddFiveSLayoutFloor1781262800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS floor varchar NOT NULL DEFAULT ''`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS floor`);
  }
}
