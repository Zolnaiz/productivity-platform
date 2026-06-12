# Productivity Platform Product Blueprint

## Product Direction

This app is a unified productivity and operations management platform for organizations. It combines project planning, task execution, employee work logs, time tracking, monthly reports, operational audits, and industry-specific inspection templates.

The core idea is closer to:

- Asana/Jira-style projects, tasks, kanban, and calendars
- Employee productivity logs, daily goals, notes, and time reports
- Lumiform-style 5S, safety, quality, risk, compliance, and inspection checklists
- Manager/admin analytics, monthly summaries, and exportable reports

## Main Roles

- Owner: full organization control, audit logs, settings, users, reports
- Admin: users, departments, templates, reports, platform configuration
- Manager: team projects, tasks, reviews, checklists, reports
- Employee: own tasks, daily work logs, time entries, notes, audits/checklists

## Core Modules

### Work Management

- Projects with progress, status, owner, team, deadline, budget, and priority
- Tasks with assignee, status, priority, due date, estimate, actual time, and checklist
- Kanban board for day-to-day execution
- Calendar for deadlines, planned work, and audit schedules
- Notifications for assignments, due dates, approvals, and reports

### Employee Productivity

- Daily work logs: what was done, project, task, hours, blockers, next steps
- Time tracking: clock-in/out, task time, monthly totals
- Daily goals and personal notes
- Pomodoro/focus sessions
- Badges or recognition for completion, consistency, and quality

### Reporting

- Employee monthly report generated from tasks, work logs, and time entries
- Project progress report with completion percentage and overdue work
- Department and organization productivity dashboard
- Export reports to PDF, CSV, and Excel
- Analytics for workload, completion rate, time spent, and recurring blockers

### Audits And Checklists

- 5S audit templates and results
- Custom questionnaire/checklist builder
- Industry templates:
  - Hospitality
  - Manufacturing
  - Construction
  - Retail
  - Logistics
  - Facility management
- Business need templates:
  - Health and safety
  - Quality
  - Operational excellence
  - Risk management and compliance
- Use-case templates:
  - Safety management
  - Energy audit
  - Forklift inspection
  - Vehicle inspection
  - QMS
  - Kaizen
  - Property inspection
  - Restaurant inspection
  - Elevator management
  - Fire inspection

## MVP Implementation Order

1. Stabilize `productivity-platform` as the main codebase.
2. Fix admin web routing, providers, protected route, and dashboard scaffold.
3. Add frontend modules for Projects, Tasks, Kanban, Calendar, Time Logs, Work Logs, 5S, and Audit Templates.
4. Add backend entities and APIs for Projects, Tasks, WorkLogs, TimeEntries, Departments, AuditTemplates, AuditRuns, and Notifications.
5. Connect dashboard and reports to real backend summary endpoints.
6. Add monthly employee report generation.
7. Bring mobile employee workflows into `mobile-flutter`.

## Data Model Backlog

- Organization
- Department
- User
- Project
- ProjectMember
- Task
- TaskChecklistItem
- WorkLog
- TimeEntry
- DailyGoal
- Note
- Notification
- AuditTemplate
- AuditQuestion
- AuditRun
- AuditAnswer
- Report
- Badge
- AuditLog

## Near-Term Web Routes

- `/` landing
- `/login`, `/register`, `/forgot-password`, `/reset-password/:token`
- `/dashboard`
- `/projects`
- `/tasks`
- `/kanban`
- `/calendar`
- `/work-logs`
- `/time`
- `/reports`
- `/analytics`
- `/fives`
- `/audit-templates`
- `/notifications`
- `/profile`
- `/pomodoro`
- `/notes`
- `/goals`
- `/badges`
- `/export`
- `/admin`
- `/users`
- `/departments`
- `/organizations`
- `/settings`
- `/audit`
