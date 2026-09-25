import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The layers a plan is audited in.
 *
 * `auditTiers` existed in the browser's types, was read by the scheduler, and
 * was stored nowhere: the column was never created and the save payload never
 * carried it. Every organization therefore ran on the built-in defaults —
 * operator daily, supervisor weekly, manager monthly — and a plant that checks
 * on a different rhythm, or calls its layers something else, had no way to say
 * so that survived a reload.
 *
 * Empty still means the defaults, so nothing changes for a plan that has never
 * been configured.
 */
export class AddFiveSLayoutAuditTiers1781263100000 implements MigrationInterface {
  name = 'AddFiveSLayoutAuditTiers1781263100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE five_s_layouts ADD COLUMN IF NOT EXISTS audit_tiers jsonb NOT NULL DEFAULT '[]'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE five_s_layouts DROP COLUMN IF EXISTS audit_tiers`);
  }
}
