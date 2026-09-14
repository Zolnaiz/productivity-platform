import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { Invitation } from './entities/invitation.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../shared/constants';
import { canAssignRole } from '../shared/roles';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import {
  createInvitationToken,
  hashInvitationToken,
  hashesMatch,
  invitationExpiry,
  normalizeEmail,
} from './invitation-token';

interface Inviter {
  id?: string;
  organizationId?: string;
  role?: string;
}


@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @InjectRepository(Invitation) private readonly invitations: Repository<Invitation>,
    private readonly usersService: UsersService,
  ) {}

  private requireOrganization(inviter: Inviter) {
    if (!inviter?.organizationId) {
      throw apiError(ErrorCode.AuthOrganizationRequired);
    }

    return inviter.organizationId;
  }

  /**
   * Creates an invitation and returns it with the raw token.
   *
   * The token is returned exactly once, here. Nothing stores it, so it cannot
   * be recovered — a lost invitation is revoked and reissued.
   */
  async invite(email: string, role: UserRole, inviter: Inviter) {
    const organizationId = this.requireOrganization(inviter);
    const address = normalizeEmail(email);

    // The same table that governs changing an existing member's role: an
    // invitation must not be a way around the hierarchy.
    if (!canAssignRole(inviter.role, role)) {
      throw apiError(ErrorCode.AccessDenied, 'role');
    }

    if (await this.usersService.findByEmail(address)) {
      throw apiError(ErrorCode.AuthEmailTaken);
    }

    // Re-inviting the same person replaces the pending invitation rather than
    // leaving two valid tokens for one seat.
    await this.invitations.delete({
      organizationId,
      email: address,
      acceptedAt: IsNull(),
    });

    const token = createInvitationToken();
    const invitation = await this.invitations.save(
      this.invitations.create({
        organizationId,
        email: address,
        role,
        tokenHash: hashInvitationToken(token),
        invitedBy: inviter.id,
        expiresAt: invitationExpiry(),
      }),
    );

    this.logger.log(`Invitation created for ${address} in organization ${organizationId}`);

    return { invitation: this.toSummary(invitation), token };
  }

  /** Pending invitations for the caller's organization. Never includes a token. */
  async findPending(inviter: Inviter) {
    const organizationId = this.requireOrganization(inviter);

    const invitations = await this.invitations.find({
      where: { organizationId, acceptedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });

    return invitations.map((invitation) => this.toSummary(invitation));
  }

  async revoke(id: string, inviter: Inviter) {
    const organizationId = this.requireOrganization(inviter);
    const invitation = await this.invitations.findOne({ where: { id, organizationId } });

    if (!invitation || invitation.acceptedAt) {
      throw apiError(ErrorCode.ResourceNotFound, 'Invitation');
    }

    await this.invitations.remove(invitation);

    return { id, revoked: true };
  }

  /**
   * What the accept screen may show before anyone signs up.
   *
   * Deliberately thin: the organization it is for and the address it was sent
   * to. A valid token should not become a way to read an organization's data.
   */
  async preview(token: string) {
    const invitation = await this.findUsable(token);

    return {
      email: invitation.email,
      role: invitation.role,
      organizationId: invitation.organizationId,
    };
  }

  /**
   * Turns an invitation into a member of the organization.
   *
   * The address is fixed by the invitation, so a forwarded token cannot be
   * used to join under a different identity.
   */
  async accept(token: string, details: { firstName: string; lastName: string; password: string }) {
    const invitation = await this.findUsable(token);

    if (await this.usersService.findByEmail(invitation.email)) {
      throw apiError(ErrorCode.AuthEmailTaken);
    }

    const user = await this.usersService.create(
      {
        email: invitation.email,
        password: details.password,
        firstName: details.firstName,
        lastName: details.lastName,
        role: invitation.role,
      } as never,
      invitation.organizationId,
    );

    invitation.acceptedAt = new Date();
    invitation.acceptedUserId = user.id;
    await this.invitations.save(invitation);

    this.logger.log(`Invitation accepted by ${invitation.email}`);

    return user;
  }

  /** Removes invitations nobody used. Keeps the table honest. */
  async purgeExpired(now = new Date()) {
    const result = await this.invitations.delete({
      acceptedAt: IsNull(),
      expiresAt: LessThan(now),
    });

    return result.affected ?? 0;
  }

  private async findUsable(token: string) {
    if (!token) {
      throw apiError(ErrorCode.InvitationInvalid);
    }

    const tokenHash = hashInvitationToken(token);
    const invitation = await this.invitations.findOne({ where: { tokenHash } });

    if (!invitation || !hashesMatch(invitation.tokenHash, tokenHash)) {
      throw apiError(ErrorCode.InvitationInvalid);
    }

    if (invitation.acceptedAt) {
      throw apiError(ErrorCode.InvitationUsed);
    }

    if (invitation.expiresAt.getTime() <= Date.now()) {
      throw apiError(ErrorCode.InvitationExpired);
    }

    return invitation;
  }

  private toSummary(invitation: Invitation) {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      organizationId: invitation.organizationId,
      invitedBy: invitation.invitedBy,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }
}
