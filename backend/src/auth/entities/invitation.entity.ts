import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { UserRole } from '../../shared/constants';

/**
 * An invitation to join an existing organization.
 *
 * Until this existed, every registration created a brand-new organization and
 * there was no way to put a second person into one — a team platform on which
 * a team could not be formed.
 */
@Entity('invitations')
@Index(['organizationId'])
@Index(['tokenHash'], { unique: true })
export class Invitation extends BaseEntity {
  @Column({ name: 'organization_id' })
  organizationId: string;

  /** Who the invitation is for. Accepting requires this exact address. */
  @Column()
  email: string;

  @Column({ type: 'varchar', default: UserRole.USER })
  role: UserRole;

  /**
   * SHA-256 of the token, never the token itself.
   *
   * The raw token grants membership of an organization, so it exists only in
   * the response to the person who created the invitation. A leaked database
   * dump does not hand anyone a working invitation.
   */
  @Column({ name: 'token_hash' })
  tokenHash: string;

  @Column({ name: 'invited_by', nullable: true })
  invitedBy?: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  /** Set once. An invitation is not reusable. */
  @Column({ type: 'timestamptz', name: 'accepted_at', nullable: true })
  acceptedAt?: Date;

  @Column({ name: 'accepted_user_id', nullable: true })
  acceptedUserId?: string;
}
