import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../entities/base.entity';

/**
 * A write a client marked with an `Idempotency-Key`, and the answer it got.
 *
 * A phone on a factory floor sends a day's write-up, the answer is lost on
 * the way back, and the phone cannot tell whether it was saved. Sent again
 * with the same key, the write is not repeated: the stored answer is.
 * Kept for a day; a retry later than that is a new write.
 */
@Entity('idempotency_keys')
@Index(['userId', 'key'], { unique: true })
export class IdempotencyKey extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  key: string;

  /** The method and route path it was first sent to, so a key reused for another request is refused. */
  @Column({ type: 'varchar', length: 300 })
  target: string;

  /** Empty while the first request is still being handled. */
  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode?: number | null;

  @Column({ type: 'jsonb', nullable: true })
  response?: unknown;
}
