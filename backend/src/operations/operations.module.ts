import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { WorkTask } from './entities/task.entity';
import { WorkLog } from './entities/work-log.entity';
import { TimeEntry } from './entities/time-entry.entity';
import { AuditTemplate } from './entities/audit-template.entity';
import { AuditRun } from './entities/audit-run.entity';
import { AssessmentTemplate } from './entities/assessment-template.entity';
import { AssessmentResponse } from './entities/assessment-response.entity';
import { ExpenseItem } from './entities/expense.entity';
import { DailyGoal } from './entities/daily-goal.entity';
import { FiveSLayout } from './entities/five-s-layout.entity';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { OperationsAuthGuard } from './guards/operations-auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
    TypeOrmModule.forFeature([
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
    ]),
  ],
  controllers: [OperationsController],
  providers: [OperationsService, OperationsAuthGuard],
  exports: [OperationsService],
})
export class OperationsModule {}
