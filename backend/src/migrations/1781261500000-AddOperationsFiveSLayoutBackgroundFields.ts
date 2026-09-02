import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFiveSLayoutBackgroundFields1781261500000 implements MigrationInterface {
  name = 'AddFiveSLayoutBackgroundFields1781261500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS background_image text NOT NULL DEFAULT ''`);
    await queryRunner.query(
      `ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS background_opacity double precision NOT NULL DEFAULT 0.55`,
    );
    await queryRunner.query(`ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS show_grid boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS show_grid`);
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS background_opacity`);
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS background_image`);
  }
}
