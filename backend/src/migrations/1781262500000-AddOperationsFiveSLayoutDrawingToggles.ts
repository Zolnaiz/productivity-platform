import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Grid, snapping and dimensions, told apart.
 *
 * There was one checkbox called Grid, and it decided both whether the grid was
 * drawn and whether dragging snapped to it. Turning the grid off to look at the
 * plan also turned off snapping, silently, and the next thing anybody dragged
 * landed a few millimetres off true with nothing to say why.
 *
 * Dimensions defaults off because a plan with every wall labelled all the time
 * is buried under its own measurements; it is turned on when somebody is
 * checking sizes rather than looking at the layout.
 */
export class AddFiveSLayoutDrawingToggles1781262500000 implements MigrationInterface {
  name = 'AddFiveSLayoutDrawingToggles1781262500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS snap_to_grid boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS show_dimensions boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS show_dimensions`);
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS snap_to_grid`);
  }
}
