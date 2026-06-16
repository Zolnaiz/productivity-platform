import dataSource from '../src/migrations/data-source';
import * as bcrypt from 'bcrypt';

const organizationId = process.env.SEED_ORGANIZATION_ID || '11111111-1111-4111-8111-000000000001';
const ownerId = process.env.SEED_OWNER_ID || '22222222-2222-4222-8222-000000000001';
const ownerEmail = process.env.SEED_OWNER_EMAIL || 'owner@example.com';
const ownerPassword = process.env.SEED_OWNER_PASSWORD || 'Password123';

const projectOne = '11111111-1111-4111-8111-111111111111';
const projectTwo = '22222222-2222-4222-8222-222222222222';
const taskOne = '33333333-3333-4333-8333-333333333333';
const taskTwo = '44444444-4444-4444-8444-444444444444';
const taskThree = '55555555-5555-4555-8555-555555555555';
const workLogOne = '66666666-6666-4666-8666-666666666666';
const timeEntryOne = '77777777-7777-4777-8777-777777777777';
const auditTemplateOne = '88888888-8888-4888-8888-888888888888';
const auditRunOne = '99999999-9999-4999-8999-999999999999';
const assessmentTemplateOne = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const assessmentResponseOne = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const expenseOne = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const json = (value: unknown) => JSON.stringify(value);

async function seed() {
  await dataSource.initialize();
  const ownerPasswordHash = await bcrypt.hash(ownerPassword, 10);

  await dataSource.query(
    `
      INSERT INTO organizations (
        id, name, description, contact_email, phone, features, settings, is_active
      ) VALUES (
        $1,
        'Demo Operations Workspace',
        'Productivity, 5S, audit, and monthly reporting demo organization.',
        $2,
        '99000000',
        'tasks,projects,time,5s,audits,reports',
        $3,
        true
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        contact_email = EXCLUDED.contact_email,
        features = EXCLUDED.features,
        settings = EXCLUDED.settings,
        updated_at = now()
    `,
    [
      organizationId,
      ownerEmail,
      json({
        language: 'mn',
        timezone: 'Asia/Ulaanbaatar',
        currency: 'MNT',
        theme: 'light',
      }),
    ],
  );

  await dataSource.query(
    `
      INSERT INTO users (
        id, "firstName", "lastName", email, password, role, position, phone, is_active, organization_id, email_verified
      ) VALUES (
        $1,
        'Demo',
        'Owner',
        $2,
        $3,
        'admin',
        'Workspace Owner',
        '99000000',
        true,
        $4,
        true
      )
      ON CONFLICT (email) DO UPDATE SET
        "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName",
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        position = EXCLUDED.position,
        phone = EXCLUDED.phone,
        is_active = true,
        organization_id = EXCLUDED.organization_id,
        email_verified = true,
        updated_at = now()
    `,
    [ownerId, ownerEmail, ownerPasswordHash, organizationId],
  );

  await dataSource.query(
    `
      INSERT INTO projects (
        id, name, description, organization_id, owner_id, status, priority, progress, start_date, due_date, budget
      ) VALUES
        ($1, 'Operations productivity rollout', 'Task, time, work log, and monthly reporting MVP.', $3, $4, 'active', 'high', 62, '2026-06-01', '2026-07-15', 12000000),
        ($2, '5S audit implementation', 'Audit templates, runs, corrective actions, and quality dashboard.', $3, $4, 'active', 'medium', 25, '2026-06-10', '2026-08-01', 4500000)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        organization_id = EXCLUDED.organization_id,
        owner_id = EXCLUDED.owner_id,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        progress = EXCLUDED.progress,
        "updatedAt" = now()
    `,
    [projectOne, projectTwo, organizationId, ownerId],
  );

  await dataSource.query(
    `
      INSERT INTO work_tasks (
        id, title, description, organization_id, project_id, assignee_id, reporter_id, status, priority, due_date, estimated_hours, actual_hours
      ) VALUES
        ($1, 'Connect work log dashboard', 'Show daily work logs and time totals on dashboard.', $4, $5, $7, $7, 'in_progress', 'high', '2026-06-18', 12, 5.5),
        ($2, 'Prepare 5S template library', 'Create 5S, safety, quality, and compliance checklist templates.', $4, $6, $7, $7, 'todo', 'medium', '2026-06-25', 16, 0),
        ($3, 'Monthly report export', 'Export employee and organization monthly summaries.', $4, $5, $7, $7, 'done', 'medium', '2026-06-12', 10, 10)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        organization_id = EXCLUDED.organization_id,
        project_id = EXCLUDED.project_id,
        assignee_id = EXCLUDED.assignee_id,
        reporter_id = EXCLUDED.reporter_id,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        actual_hours = EXCLUDED.actual_hours,
        "updatedAt" = now()
    `,
    [taskOne, taskTwo, taskThree, organizationId, projectOne, projectTwo, ownerId],
  );

  await dataSource.query(
    `
      INSERT INTO work_logs (
        id, organization_id, user_id, project_id, task_id, log_date, summary, blockers, next_steps, hours
      ) VALUES
        ($1, $2, $3, $4, $5, '2026-06-12', 'Dashboard, auth guard, and operations API hardening completed.', 'Runtime DB smoke waits for PostgreSQL.', 'Run migration and token smoke test after DB starts.', 6.5)
      ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        user_id = EXCLUDED.user_id,
        project_id = EXCLUDED.project_id,
        task_id = EXCLUDED.task_id,
        summary = EXCLUDED.summary,
        blockers = EXCLUDED.blockers,
        next_steps = EXCLUDED.next_steps,
        hours = EXCLUDED.hours,
        "updatedAt" = now()
    `,
    [workLogOne, organizationId, ownerId, projectOne, taskOne],
  );

  await dataSource.query(
    `
      INSERT INTO time_entries (
        id, organization_id, user_id, project_id, task_id, work_date, hours, note
      ) VALUES
        ($1, $2, $3, $4, $5, '2026-06-12', 6.5, 'Backend hardening and verification')
      ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        user_id = EXCLUDED.user_id,
        project_id = EXCLUDED.project_id,
        task_id = EXCLUDED.task_id,
        hours = EXCLUDED.hours,
        note = EXCLUDED.note,
        "updatedAt" = now()
    `,
    [timeEntryOne, organizationId, ownerId, projectOne, taskOne],
  );

  await dataSource.query(
    `
      INSERT INTO audit_templates (
        id, title, description, organization_id, category, industry, questions, is_active
      ) VALUES
        ($1, '5S workplace audit', 'Sort, set in order, shine, standardize, sustain checklist.', $2, '5s', 'Manufacturing', $3, true)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        organization_id = EXCLUDED.organization_id,
        questions = EXCLUDED.questions,
        "updatedAt" = now()
    `,
    [
      auditTemplateOne,
      organizationId,
      json([
        { id: 'sort', text: 'Unused items are removed from the work area.', type: 'score', maxScore: 5 },
        { id: 'set', text: 'Tools and materials have clear locations.', type: 'score', maxScore: 5 },
        { id: 'shine', text: 'Area is clean and defects are visible.', type: 'score', maxScore: 5 },
      ]),
    ],
  );

  await dataSource.query(
    `
      INSERT INTO audit_runs (
        id, organization_id, template_id, auditor_id, project_id, location, answers, score, status
      ) VALUES
        ($1, $2, $3, $4, $5, 'Main production floor', $6, 82, 'submitted')
      ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        template_id = EXCLUDED.template_id,
        auditor_id = EXCLUDED.auditor_id,
        project_id = EXCLUDED.project_id,
        answers = EXCLUDED.answers,
        score = EXCLUDED.score,
        status = EXCLUDED.status,
        "updatedAt" = now()
    `,
    [
      auditRunOne,
      organizationId,
      auditTemplateOne,
      ownerId,
      projectTwo,
      json([
        { questionId: 'sort', value: 4, note: 'Red-tag area in use.' },
        { questionId: 'set', value: 4, note: 'Labels need refresh.' },
        { questionId: 'shine', value: 5, note: 'Clean and visible.' },
      ]),
    ],
  );

  await dataSource.query(
    `
      INSERT INTO assessment_templates (
        id, title, description, organization_id, type, status, industry, questions
      ) VALUES
        ($1, 'Daily operations checklist', 'Short supervisor checklist for execution quality.', $2, 'inspection', 'published', 'Operations', $3)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        organization_id = EXCLUDED.organization_id,
        questions = EXCLUDED.questions,
        "updatedAt" = now()
    `,
    [
      assessmentTemplateOne,
      organizationId,
      json([
        { id: 'handover', text: 'Shift handover completed.', type: 'yes_no' },
        { id: 'blockers', text: 'Blockers documented.', type: 'text' },
        { id: 'execution', text: 'Execution quality score.', type: 'score', maxScore: 100 },
      ]),
    ],
  );

  await dataSource.query(
    `
      INSERT INTO assessment_responses (
        id, template_id, organization_id, respondent_id, respondent, department, status, score, answers, submitted_at
      ) VALUES
        ($1, $2, $3, $4, 'Employee User', 'Operations', 'submitted', 87, $5, now())
      ON CONFLICT (id) DO UPDATE SET
        template_id = EXCLUDED.template_id,
        organization_id = EXCLUDED.organization_id,
        respondent_id = EXCLUDED.respondent_id,
        score = EXCLUDED.score,
        answers = EXCLUDED.answers,
        "updatedAt" = now()
    `,
    [
      assessmentResponseOne,
      assessmentTemplateOne,
      organizationId,
      ownerId,
      json([
        { questionId: 'handover', value: true },
        { questionId: 'blockers', value: 'No critical blockers.' },
        { questionId: 'execution', value: 87 },
      ]),
    ],
  );

  await dataSource.query(
    `
      INSERT INTO expenses (
        id, title, organization_id, project_id, category, amount, status, expense_date, submitted_by, note
      ) VALUES
        ($1, 'Dashboard reporting tools', $2, $3, 'software', 450000, 'approved', '2026-06-10', 'Demo Owner', 'Reporting and export preparation.')
      ON CONFLICT (id) DO UPDATE SET
        organization_id = EXCLUDED.organization_id,
        project_id = EXCLUDED.project_id,
        amount = EXCLUDED.amount,
        status = EXCLUDED.status,
        note = EXCLUDED.note,
        "updatedAt" = now()
    `,
    [expenseOne, organizationId, projectOne],
  );

  await dataSource.destroy();
  console.log(`Seeded operations demo data for organization "${organizationId}" and user "${ownerEmail}".`);
}

seed().catch(async (error) => {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  console.error(error);
  process.exit(1);
});
