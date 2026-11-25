/**
 * Organisation guard rails shared by the operations services: resolves the caller's organisation, loads a row
 * only if it belongs to it (404 otherwise) and checks department membership.
 */
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { noteAuditBefore } from '../audit/audit-context';

type CurrentUser = {
  id?: string;
  role?: string;
  organizationId?: string;
};

/**
 * Which organization a request acts in, and the record lookups and updates
 * that keep it there.
 *
 * Every operations read is filtered to the caller's organization, and every
 * update keeps a record in the organization it belongs to - the one boundary
 * this application promises. Shared by OperationsService and the domain
 * classes split out of it (FiveSRecords), so there is one copy of the rule.
 */
export class OrganizationScope {
  constructor(private readonly configService: ConfigService) {}

  organizationWhere(user: CurrentUser) {
    const organizationId = this.resolveOrganizationId(user);
    return organizationId ? { organizationId } : {};
  }

  personalWhere(user: CurrentUser) {
    return {
      ...this.organizationWhere(user),
      ...(user?.id ? { userId: user.id } : {}),
    };
  }

  resolveOrganizationId(user?: CurrentUser, payloadOrganizationId?: string) {
    const allowPublicOperations = this.configService.get('ALLOW_PUBLIC_OPERATIONS') === true;

    if (user?.organizationId) {
      return user.organizationId;
    }

    if (!allowPublicOperations) {
      throw apiError(ErrorCode.AuthOrganizationRequired);
    }

    return payloadOrganizationId;
  }

  async findOneScoped<T extends { id: string; organizationId?: string }>(
    repository: Repository<T>,
    id: string,
    user: CurrentUser,
    label: string,
  ) {
    const entity = await repository.findOne({
      where: {
        id,
        ...this.organizationWhere(user),
      } as any,
    });

    if (!entity) {
      throw apiError(ErrorCode.ResourceNotFound, label);
    }

    return entity;
  }

  async findOnePersonalScoped<T extends { id: string; organizationId?: string; userId?: string }>(
    repository: Repository<T>,
    id: string,
    user: CurrentUser,
    label: string,
  ) {
    const entity = await repository.findOne({
      where: {
        id,
        ...this.personalWhere(user),
      } as any,
    });

    if (!entity) {
      throw apiError(ErrorCode.ResourceNotFound, label);
    }

    return entity;
  }

  assignWithoutOrganizationChange<T extends { organizationId?: string }>(entity: T, payload: Partial<T>) {
    const safePayload = { ...payload };
    delete safePayload.organizationId;
    /*
      Every update here loads the record, assigns and saves, so this is the one
      place that can say what a value was before it was overwritten — and the
      trail could only ever say what the change asked for.
    */
    noteAuditBefore(entity, Object.keys(safePayload));
    Object.assign(entity, safePayload);
  }

  assignWithoutPersonalScopeChange<T extends { organizationId?: string; userId?: string }>(
    entity: T,
    payload: Partial<T>,
  ) {
    const safePayload = { ...payload };
    delete safePayload.organizationId;
    delete safePayload.userId;
    noteAuditBefore(entity, Object.keys(safePayload));
    Object.assign(entity, safePayload);
  }
}
