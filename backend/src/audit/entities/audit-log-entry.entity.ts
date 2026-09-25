import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ChangeSummary } from '../change-summary';

/**
 * One thing somebody did.
 *
 * Deliberately not a `BaseEntity`: there is no `updatedAt` and no `deletedAt`,
 * because an entry that can be edited or removed is not evidence. The table is
 * append-only, and the service exposes no way to change a row.
 *
 * Every column is filled by the server from the request it observed. Nothing
 * here is taken from a request body, so a client cannot write its own history.
 */
@Entity('audit_log_entries')
@Index(['organizationId', 'createdAt'])
export class AuditLogEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  /** Null for an action taken with the public-operations switch on. */
  @Column({ name: 'actor_id', nullable: true })
  actorId?: string;

  /** Kept as written at the time, so deleting an account does not erase who acted. */
  @Column({ name: 'actor_name', nullable: true })
  actorName?: string;

  @Column({ name: 'actor_role', nullable: true })
  actorRole?: string;

  /** The part of the system acted on: `projects`, `users`, `audit-runs`. */
  @Column()
  module: string;

  /** `created`, `updated`, `deleted`, or the named action on the route. */
  @Column()
  action: string;

  /** The record acted on, when the route named one. */
  @Column({ name: 'target_id', nullable: true })
  targetId?: string;

  @Column()
  method: string;

  @Column()
  route: string;

  @Column({ name: 'status_code', type: 'int' })
  statusCode: number;

  @Column({ default: 'info' })
  severity: 'info' | 'warning' | 'critical';

  /**
   * What the request asked to change: the field names, and the values with
   * secrets redacted and anything too large described rather than copied.
   *
   * Null for a request that carried no body — a delete, or a named action on
   * a route. See `change-summary.ts`: the rules there are what make a request
   * body safe to keep any part of.
   */
  @Column({ type: 'jsonb', nullable: true })
  changes?: ChangeSummary | null;

  /**
   * What those fields held before the change.
   *
   * Null when nothing could say — a creation has no before, and a route whose
   * service does not load the record first has nothing to hand over. Summarised
   * by the same rules as the change itself, so a secret cannot reach the table
   * by this door either.
   */
  @Column({ type: 'jsonb', name: 'before_values', nullable: true })
  before?: ChangeSummary | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
