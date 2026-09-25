import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { noteAuditBefore } from '../audit/audit-context';
import { apiError, ErrorCode } from '../shared/errors/api-error';

/**
 * The organization a person belongs to.
 *
 * Deliberately small. This module sat fully written and unregistered for a
 * long time, and what it contained was not merely unused:
 *
 * - `inviteUser` created an account with a generated password and returned
 *   that password in the response, with a comment saying not to in production.
 *   It is the thing the invitation flow exists to prevent: a way into an
 *   organization that never proves the address belongs to anyone. Worse, given
 *   the address of somebody already in another organization it moved them —
 *   account and role — into the caller's. Deleted; `POST /auth/invitations` is
 *   the way in.
 * - `removeUser` duplicated `DELETE /users/:id` with its own weaker checks.
 *   Deleted.
 * - `getStats` counted rows in `questionnaires` and `responses`, tables this
 *   system does not have, so it could only have thrown. `/operations/summary`
 *   is the real one. Deleted.
 * - A fourth copy of the role hierarchy lived here, knowing three of the six
 *   roles and letting a super admin appoint another. Deleted;
 *   `shared/roles.ts` is the only copy.
 *
 * What is left is what the product uses: registration creates one, and an
 * organization reads and edits its own record.
 */
@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizations: Repository<Organization>,
  ) {}

  /** Called when somebody registers; nothing else creates an organization. */
  async create(createOrganizationDto: CreateOrganizationDto) {
    if (await this.organizations.findOne({ where: { name: createOrganizationDto.name } })) {
      throw apiError(ErrorCode.AuthOrganizationTaken);
    }

    return this.organizations.save(this.organizations.create(createOrganizationDto));
  }

  /**
   * The caller's own organization.
   *
   * Without the `users` relation the previous version loaded: a request for
   * the workspace name and address answered with every member of the
   * organization, password column included. The member list is
   * `GET /users`, which is guarded and paged.
   */
  async getMyOrganization(organizationId?: string) {
    if (!organizationId) {
      throw apiError(ErrorCode.AuthOrganizationRequired);
    }

    const organization = await this.organizations.findOne({ where: { id: organizationId } });

    if (!organization) {
      throw apiError(ErrorCode.ResourceNotFound, 'Organization');
    }

    return organization;
  }

  /**
   * Edits the caller's own organization.
   *
   * The id comes from the caller's token rather than the request, so there is
   * no path here to another tenant's record.
   */
  async updateMyOrganization(organizationId: string | undefined, changes: UpdateOrganizationDto) {
    const organization = await this.getMyOrganization(organizationId);

    if (changes.name && changes.name !== organization.name) {
      const taken = await this.organizations.findOne({ where: { name: changes.name } });

      if (taken && taken.id !== organization.id) {
        throw apiError(ErrorCode.AuthOrganizationTaken);
      }
    }

    // What these fields held before they are overwritten. The record is
    // already loaded, so the trail gets its other half for nothing.
    noteAuditBefore(organization, Object.keys(changes));
    Object.assign(organization, changes);

    return this.organizations.save(organization);
  }

  findById(id: string) {
    return this.organizations.findOne({ where: { id } });
  }
}
