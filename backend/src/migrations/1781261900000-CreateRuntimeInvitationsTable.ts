import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Invitations to join an existing organization.
 *
 * Before this, every registration created a new organization and nothing could
 * add a second person to one. Only the token's SHA-256 is stored: the raw
 * token grants membership, so a database dump must not hand anyone a working
 * invitation.
 */
export class CreateRuntimeInvitationsTable1781261900000 implements MigrationInterface {
  name = 'CreateRuntimeInvitationsTable1781261900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id varchar NOT NULL,
        email varchar NOT NULL,
        role varchar NOT NULL DEFAULT 'user',
        token_hash varchar NOT NULL,
        invited_by varchar,
        expires_at timestamptz NOT NULL,
        accepted_at timestamptz,
        accepted_user_id varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_token_hash ON invitations (token_hash)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations (organization_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS invitations`);
  }
}
