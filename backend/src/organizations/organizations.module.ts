import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { Organization } from './entities/organization.entity';
import { DatabaseModule } from '../shared/database/database.module';
import { PermissionsGuard } from '../shared/guards/permissions.guard';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Organization]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, PermissionsGuard],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}