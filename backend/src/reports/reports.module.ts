import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from '../shared/entities/report.entity';
import { Questionnaire } from '../shared/entities/questionnaire.entity';
import { Expense } from '../shared/entities/expense.entity';
import { Response } from '../shared/entities/response.entity';
import { UsersModule } from '../users/users.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, Questionnaire, Expense, Response]),
    UsersModule,
    OrganizationsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}