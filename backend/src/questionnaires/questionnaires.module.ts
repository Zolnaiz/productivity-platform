import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnairesService } from './questionnaires.service';
import { Questionnaire } from './entities/questionnaire.entity';
import { DatabaseModule } from '../shared/database/database.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Questionnaire]),
    OrganizationsModule,
    UsersModule,
  ],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService],
  exports: [QuestionnairesService],
})
export class QuestionnairesModule {}