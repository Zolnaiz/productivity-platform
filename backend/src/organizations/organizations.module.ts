import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { Organization } from './entities/organization.entity';
import { DatabaseModule } from '../shared/database/database.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Organization]),
    UsersModule,
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}