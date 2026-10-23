import { MigrationInterface, QueryRunner } from 'typeorm';

/** Writes a client marked with an `Idempotency-Key`, and the answers they got. */
export class CreateOperationsIdempotencyKeysTable1781265300000 implements MigrationInterface {
  name = 'CreateOperationsIdempotencyKeysTable1781265300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id varchar NOT NULL,
        key varchar(100) NOT NULL,
        target varchar(300) NOT NULL,
        status_code int,
        response jsonb,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_idempotency_keys_user_key ON idempotency_keys (user_id, key)`,
    );
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created ON idempotency_keys ("createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS idempotency_keys`);
  }
}
