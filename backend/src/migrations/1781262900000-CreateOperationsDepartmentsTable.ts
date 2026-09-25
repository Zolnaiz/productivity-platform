import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Departments, and the column that puts a person in one.
 *
 * The page existed and said out loud that its list lived in the browser. What
 * was missing was not a table but a decision about what a department owns; it
 * owns its people and its 5S areas, so this creates the table and adds the
 * person's half of that.
 *
 * A zone's department is not here: zones live inside the floor plan's JSON
 * document, and one attribute of a zone does not become a column because it
 * points at a row.
 *
 * `department_id` is left without a foreign key for the same reason the rest
 * of this schema carries ids as plain columns — organization membership is
 * enforced in the service, and a hard constraint here would make deleting a
 * department a database error rather than a decision the application makes.
 */
export class CreateDepartmentsTable1781262900000 implements MigrationInterface {
  name = 'CreateDepartmentsTable1781262900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        organization_id varchar,
        name varchar NOT NULL,
        manager_id varchar,
        focus_area text
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_departments_organization ON departments (organization_id)`,
    );
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id varchar`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_department ON users (department_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_department`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS department_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS departments`);
  }
}
