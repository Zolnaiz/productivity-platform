import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOperationsTables1781261000000 implements MigrationInterface {
  name = 'CreateOperationsTables1781261000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar NOT NULL,
        description text,
        organization_id varchar,
        owner_id varchar,
        status varchar NOT NULL DEFAULT 'planned',
        priority varchar NOT NULL DEFAULT 'medium',
        progress integer NOT NULL DEFAULT 0,
        start_date date,
        due_date date,
        budget numeric(14,2) NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS work_tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar NOT NULL,
        description text,
        organization_id varchar,
        project_id uuid,
        assignee_id varchar,
        reporter_id varchar,
        status varchar NOT NULL DEFAULT 'todo',
        priority varchar NOT NULL DEFAULT 'medium',
        due_date date,
        estimated_hours numeric(8,2) NOT NULL DEFAULT 0,
        actual_hours numeric(8,2) NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS work_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id varchar,
        user_id varchar,
        project_id uuid,
        task_id uuid,
        log_date date NOT NULL,
        summary text NOT NULL,
        blockers text,
        next_steps text,
        hours numeric(8,2) NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id varchar,
        user_id varchar,
        project_id uuid,
        task_id uuid,
        work_date date NOT NULL,
        started_at timestamptz,
        ended_at timestamptz,
        hours numeric(8,2) NOT NULL DEFAULT 0,
        note text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_templates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar NOT NULL,
        description text,
        organization_id varchar,
        category varchar NOT NULL DEFAULT '5s',
        industry varchar,
        questions jsonb NOT NULL DEFAULT '[]',
        is_active boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_runs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id varchar,
        template_id uuid NOT NULL,
        auditor_id varchar,
        project_id uuid,
        location varchar,
        answers jsonb NOT NULL DEFAULT '[]',
        score numeric(8,2) NOT NULL DEFAULT 0,
        status varchar NOT NULL DEFAULT 'draft',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS assessment_templates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar NOT NULL,
        description text,
        organization_id varchar,
        type varchar NOT NULL DEFAULT 'inspection',
        status varchar NOT NULL DEFAULT 'draft',
        industry varchar NOT NULL DEFAULT 'General',
        questions jsonb NOT NULL DEFAULT '[]',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS assessment_responses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id uuid NOT NULL,
        organization_id varchar,
        respondent_id varchar,
        respondent varchar NOT NULL DEFAULT 'Anonymous',
        department varchar NOT NULL DEFAULT 'General',
        status varchar NOT NULL DEFAULT 'submitted',
        score integer NOT NULL DEFAULT 0,
        answers jsonb NOT NULL DEFAULT '[]',
        submitted_at timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title varchar NOT NULL,
        organization_id varchar,
        project_id uuid,
        category varchar NOT NULL DEFAULT 'other',
        amount numeric(14,2) NOT NULL DEFAULT 0,
        status varchar NOT NULL DEFAULT 'submitted',
        expense_date date NOT NULL,
        submitted_by varchar,
        note text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_work_tasks_organization_id ON work_tasks (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_work_tasks_project_id ON work_tasks (project_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_work_tasks_assignee_id ON work_tasks (assignee_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_work_tasks_status ON work_tasks (status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_work_logs_organization_id ON work_logs (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_work_logs_user_id ON work_logs (user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_work_logs_log_date ON work_logs (log_date)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_time_entries_organization_id ON time_entries (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries (user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_time_entries_work_date ON time_entries (work_date)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_templates_organization_id ON audit_templates (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_templates_category ON audit_templates (category)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_runs_organization_id ON audit_runs (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_runs_template_id ON audit_runs (template_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_runs_auditor_id ON audit_runs (auditor_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_assessment_templates_organization_id ON assessment_templates (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_assessment_templates_status ON assessment_templates (status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_assessment_templates_type ON assessment_templates (type)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_assessment_responses_organization_id ON assessment_responses (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_assessment_responses_template_id ON assessment_responses (template_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_assessment_responses_status ON assessment_responses (status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_expenses_organization_id ON expenses (organization_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses (project_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses (status)`);

    await queryRunner.query(`
      ALTER TABLE work_tasks
      ADD CONSTRAINT fk_work_tasks_project_id
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE work_logs
      ADD CONSTRAINT fk_work_logs_project_id
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE work_logs
      ADD CONSTRAINT fk_work_logs_task_id
      FOREIGN KEY (task_id) REFERENCES work_tasks(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE time_entries
      ADD CONSTRAINT fk_time_entries_project_id
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE time_entries
      ADD CONSTRAINT fk_time_entries_task_id
      FOREIGN KEY (task_id) REFERENCES work_tasks(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE audit_runs
      ADD CONSTRAINT fk_audit_runs_template_id
      FOREIGN KEY (template_id) REFERENCES audit_templates(id) ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE audit_runs
      ADD CONSTRAINT fk_audit_runs_project_id
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE assessment_responses
      ADD CONSTRAINT fk_assessment_responses_template_id
      FOREIGN KEY (template_id) REFERENCES assessment_templates(id) ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE expenses
      ADD CONSTRAINT fk_expenses_project_id
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE IF EXISTS expenses DROP CONSTRAINT IF EXISTS fk_expenses_project_id`);
    await queryRunner.query(
      `ALTER TABLE IF EXISTS assessment_responses DROP CONSTRAINT IF EXISTS fk_assessment_responses_template_id`,
    );
    await queryRunner.query(`ALTER TABLE IF EXISTS audit_runs DROP CONSTRAINT IF EXISTS fk_audit_runs_project_id`);
    await queryRunner.query(`ALTER TABLE IF EXISTS audit_runs DROP CONSTRAINT IF EXISTS fk_audit_runs_template_id`);
    await queryRunner.query(`ALTER TABLE IF EXISTS time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_task_id`);
    await queryRunner.query(`ALTER TABLE IF EXISTS time_entries DROP CONSTRAINT IF EXISTS fk_time_entries_project_id`);
    await queryRunner.query(`ALTER TABLE IF EXISTS work_logs DROP CONSTRAINT IF EXISTS fk_work_logs_task_id`);
    await queryRunner.query(`ALTER TABLE IF EXISTS work_logs DROP CONSTRAINT IF EXISTS fk_work_logs_project_id`);
    await queryRunner.query(`ALTER TABLE IF EXISTS work_tasks DROP CONSTRAINT IF EXISTS fk_work_tasks_project_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS expenses`);
    await queryRunner.query(`DROP TABLE IF EXISTS assessment_responses`);
    await queryRunner.query(`DROP TABLE IF EXISTS assessment_templates`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_runs`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_templates`);
    await queryRunner.query(`DROP TABLE IF EXISTS time_entries`);
    await queryRunner.query(`DROP TABLE IF EXISTS work_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS work_tasks`);
    await queryRunner.query(`DROP TABLE IF EXISTS projects`);
  }
}
