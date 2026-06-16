import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRuntimeAuthTables1781260500000 implements MigrationInterface {
  name = 'CreateRuntimeAuthTables1781260500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar NOT NULL,
        description text,
        logo_url varchar,
        website varchar,
        contact_email varchar,
        phone varchar,
        address text,
        features text,
        settings jsonb,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "firstName" varchar NOT NULL,
        "lastName" varchar NOT NULL,
        email varchar NOT NULL,
        password varchar NOT NULL,
        role varchar NOT NULL DEFAULT 'user',
        position varchar,
        phone varchar,
        profile_image_url varchar,
        is_active boolean NOT NULL DEFAULT true,
        organization_id uuid,
        last_login timestamptz,
        email_verified boolean DEFAULT false,
        verification_token varchar,
        reset_password_token varchar,
        reset_password_expires timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_name ON organizations (name)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)`);

    await queryRunner.query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_users_organization_id
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS fk_users_organization_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizations`);
  }
}
