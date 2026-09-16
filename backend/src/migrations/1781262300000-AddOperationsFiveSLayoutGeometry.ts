import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Somewhere to keep the walls.
 *
 * The editor learned to draw walls that meet at corners, to find the rooms
 * they enclose, and to hold a scale in metres — and none of it was ever sent
 * to the server or stored, because the table had only zones and objects. So a
 * plan drawn against a real backend was complete until the page reloaded, and
 * then it was empty again. Nothing complained: the fields were simply dropped
 * on the way out.
 *
 * Openings live here too rather than among the objects. A door is not a thing
 * standing on the floor, it is a hole in a wall, and storing it as an object
 * would put it back to floating free of the wall it belongs to.
 */
export class AddFiveSLayoutGeometry1781262300000 implements MigrationInterface {
  name = 'AddFiveSLayoutGeometry1781262300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS corners jsonb NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS walls jsonb NOT NULL DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS openings jsonb NOT NULL DEFAULT '[]'`);
    // Nullable on purpose: a plan drawn before the scale existed has no scale,
    // and that is different from a plan measured at zero metres per unit.
    await queryRunner.query(`ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS metres_per_unit double precision`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS metres_per_unit`);
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS openings`);
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS walls`);
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS corners`);
  }
}
