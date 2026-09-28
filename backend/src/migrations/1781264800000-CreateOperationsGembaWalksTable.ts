import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Gemba walks: where a manager went, what they saw and asked, and the work it raised.
 */
export class CreateOperationsGembaWalksTable1781264800000 implements MigrationInterface {
  name = 'CreateOperationsGembaWalksTable1781264800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS gemba_walks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz,
        organization_id varchar NOT NULL,
        walker_id varchar NOT NULL,
        walked_on date NOT NULL,
        zone_id varchar,
        area varchar(200) NOT NULL DEFAULT '',
        observations text NOT NULL DEFAULT '',
        conversations text NOT NULL DEFAULT '',
        follow_ups jsonb NOT NULL DEFAULT '[]'::jsonb
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_gemba_walks_organization_day ON gemba_walks (organization_id, walked_on)`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_gemba_walks_walker ON gemba_walks (walker_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS gemba_walks`);
  }
}
