import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Which generation of refresh tokens a person's account accepts.
 *
 * A refresh token was valid for its whole week whatever happened to the
 * account: somebody who changed their password because a phone was stolen
 * left the thief signed in. A refresh token now carries the version it was
 * issued under, and a password change or reset moves the account to the next.
 */
export class AddOperationsUserTokenVersion1781265500000 implements MigrationInterface {
  name = 'AddOperationsUserTokenVersion1781265500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version int NOT NULL DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS token_version`);
  }
}
