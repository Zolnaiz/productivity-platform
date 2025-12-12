import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { Expense } from './entities/expense.entity';
import { DatabaseModule } from '../shared/database/database.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Expense]),
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}