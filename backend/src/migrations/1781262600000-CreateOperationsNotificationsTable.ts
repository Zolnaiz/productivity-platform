import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Somewhere to put what people need to be told.
 *
 * The scheduler raises an audit task at six in the morning and a red-tag
 * decision when a hold runs out, and both waited in a list for somebody to
 * open. Work that has to be discovered is work that is found late.
 *
 * The unique index across recipient, source type and source id is what makes
 * the delivery safe to repeat: the scheduler running twice in a morning, or
 * two replicas at six, reaches one person once.
 */
export class CreateNotificationsTable1781262600000 implements MigrationInterface {
  name = 'CreateNotificationsTable1781262600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        organization_id varchar,
        user_id varchar NOT NULL,
        kind varchar NOT NULL DEFAULT 'task_assigned',
        title varchar NOT NULL,
        body text NOT NULL DEFAULT '',
        link varchar NOT NULL DEFAULT '/tasks',
        source_type varchar,
        source_id varchar,
        read_at timestamptz
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_organization ON notifications (organization_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_notifications_inbox ON notifications (user_id, read_at)`,
    );
    // Partial, because a notification raised by hand carries no source and
    // several of those for one person are not a duplicate.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_source
      ON notifications (user_id, source_type, source_id)
      WHERE source_type IS NOT NULL AND source_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
  }
}
