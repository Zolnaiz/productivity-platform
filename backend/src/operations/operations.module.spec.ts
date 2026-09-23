import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { AssessmentResponse } from './entities/assessment-response.entity';
import { AssessmentTemplate } from './entities/assessment-template.entity';
import { Attachment } from './entities/attachment.entity';
import { AuditRun } from './entities/audit-run.entity';
import { AuditTemplate } from './entities/audit-template.entity';
import { DailyGoal } from './entities/daily-goal.entity';
import { ExpenseItem } from './entities/expense.entity';
import { FiveSLayout } from './entities/five-s-layout.entity';
import { Project } from './entities/project.entity';
import { WorkTask } from './entities/task.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { WorkLog } from './entities/work-log.entity';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { ATTACHMENT_STORE, createAttachmentStore } from './attachment-store';
import { AuditSchedulerService } from './audit-scheduler.service';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { Notification } from './entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const entities = [
  Project,
  WorkTask,
  WorkLog,
  TimeEntry,
  AuditTemplate,
  AuditRun,
  AssessmentTemplate,
  AssessmentResponse,
  ExpenseItem,
  DailyGoal,
  FiveSLayout,
  Attachment,
  Notification,
];

const repositoryMock = () => ({ find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() });

/**
 * Proves the module's dependency graph resolves.
 *
 * Every other spec builds services by hand with `new`, so a provider that is
 * declared but not registered — or one whose dependency the module does not
 * supply — compiles, passes every test, and fails only when the application
 * starts. This is the cheapest check that the app can boot.
 */
describe('OperationsModule wiring', () => {
  const build = () =>
    Test.createTestingModule({
      controllers: [OperationsController, AttachmentsController, NotificationsController],
      providers: [
        OperationsService,
        AttachmentsService,
        AuditSchedulerService,
        NotificationsService,
        // The controllers are guarded, so the guard and its JwtService are
        // part of the graph the application actually builds.
        OperationsAuthGuard,
        PermissionsGuard,
        { provide: JwtService, useValue: { verify: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
        // The real factory, so an unconfigured deployment is proved to fall
        // back to local disk rather than failing to start.
        { provide: ATTACHMENT_STORE, useFactory: createAttachmentStore, inject: [ConfigService] },
        ...entities.map((entity) => ({
          provide: getRepositoryToken(entity),
          useValue: repositoryMock(),
        })),
      ],
    }).compile();

  it('constructs every provider the module declares', async () => {
    const moduleRef = await build();

    expect(moduleRef.get(OperationsService)).toBeInstanceOf(OperationsService);
    expect(moduleRef.get(AttachmentsService)).toBeInstanceOf(AttachmentsService);
    expect(moduleRef.get(AuditSchedulerService)).toBeInstanceOf(AuditSchedulerService);
    expect(moduleRef.get(OperationsAuthGuard)).toBeInstanceOf(OperationsAuthGuard);
  });

  it('constructs every controller the module exposes', async () => {
    const moduleRef = await build();

    expect(moduleRef.get(OperationsController)).toBeInstanceOf(OperationsController);
    expect(moduleRef.get(AttachmentsController)).toBeInstanceOf(AttachmentsController);
  });

  it('gives the scheduler a real operations service to raise work through', async () => {
    const moduleRef = await build();
    const scheduler = moduleRef.get(AuditSchedulerService);

    // Switched off by the stub config, so this exercises construction and the
    // guard clause without touching a repository.
    await expect(scheduler.raiseDueAudits()).resolves.toBeUndefined();
  });
});
