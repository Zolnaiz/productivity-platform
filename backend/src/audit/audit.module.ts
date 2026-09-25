import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntry } from './entities/audit-log-entry.entity';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { AuditRetentionService } from './audit-retention.service';
import { PermissionsGuard } from '../shared/guards/permissions.guard';

/**
 * Global because the interceptor that writes entries is registered once for
 * the whole application, and it needs this service. Making the module global
 * is what lets every route be covered without each feature module importing
 * the audit log to be audited — which would be a rule someone could forget.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntry])],
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditRetentionService, PermissionsGuard],
  exports: [AuditLogService],
})
export class AuditModule {}
