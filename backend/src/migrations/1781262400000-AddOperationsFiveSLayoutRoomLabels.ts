import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Names for rooms.
 *
 * A room is not stored — it is whatever the walls close in, worked out on every
 * redraw — so a name cannot be a field on one. It is a point with words on it,
 * and the room it names is whichever room that point falls inside. Which is
 * why this is its own column rather than something hung off the walls.
 */
export class AddFiveSLayoutRoomLabels1781262400000 implements MigrationInterface {
  name = 'AddFiveSLayoutRoomLabels1781262400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS room_labels jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS room_labels`);
  }
}
