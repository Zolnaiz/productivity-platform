import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFiveSLayoutsTable1781261400000 implements MigrationInterface {
  name = 'CreateFiveSLayoutsTable1781261400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS five_s_layouts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id varchar,
        name varchar NOT NULL DEFAULT '5S area map',
        site varchar NOT NULL DEFAULT 'Workspace',
        scale varchar NOT NULL DEFAULT '1 square = 1 meter',
        background_image text NOT NULL DEFAULT '',
        background_opacity double precision NOT NULL DEFAULT 0.55,
        show_grid boolean NOT NULL DEFAULT true,
        zones jsonb NOT NULL DEFAULT '[]',
        objects jsonb NOT NULL DEFAULT '[]',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_five_s_layouts_organization_id ON five_s_layouts (organization_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS five_s_layouts`);
  }
}
