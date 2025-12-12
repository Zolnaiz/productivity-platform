import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DetailedSeedService } from './detailed-seed.service';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Questionnaire } from '../entities/questionnaire.entity';
import { Response } from '../entities/response.entity';
import { Expense } from '../../expenses/entities/expense.entity';
import { Report } from '../entities/report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      Questionnaire,
      Response,
      Expense,
      Report,
    ]),
  ],
  providers: [DetailedSeedService],
  exports: [DetailedSeedService],
})
export class SeedModule {}