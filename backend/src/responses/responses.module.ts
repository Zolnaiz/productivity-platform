import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponsesController } from './responses.controller';
import { ResponsesService } from './responses.service';
import { Response } from './entities/response.entity';
import { DatabaseModule } from '../shared/database/database.module';
import { QuestionnairesModule } from '../questionnaires/questionnaires.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Response]),
    QuestionnairesModule,
    UsersModule,
  ],
  controllers: [ResponsesController],
  providers: [ResponsesService],
  exports: [ResponsesService],
})
export class ResponsesModule {}