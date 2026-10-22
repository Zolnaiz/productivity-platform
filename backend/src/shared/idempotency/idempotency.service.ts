import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { apiError, ErrorCode } from '../errors/api-error';
import { IdempotencyKey } from './idempotency-key.entity';

/** How long a key keeps its answer. A retry later than this is a new write. */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';

export type Claim =
  | { claimed: true; id: string }
  | { claimed: false; statusCode: number; response: unknown };

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(@InjectRepository(IdempotencyKey) private readonly keys: Repository<IdempotencyKey>) {}

  /**
   * Takes the key for this request, or returns what the first request with
   * it was answered.
   *
   * The unique index decides who is first, so two copies of one request that
   * arrive together are not both written: the second is told the first is
   * still being handled, and its retry gets the stored answer.
   */
  async claim(userId: string, key: string, target: string, now = new Date()): Promise<Claim> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const row = await this.keys.save(this.keys.create({ userId, key, target }));
        return { claimed: true, id: row.id };
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }

      const existing = await this.keys.findOne({ where: { userId, key } });
      if (!existing) throw apiError(ErrorCode.RequestInProgress);

      // Past its day, the key is free again.
      if (now.getTime() - new Date(existing.createdAt).getTime() > IDEMPOTENCY_TTL_MS) {
        await this.keys.delete({ id: existing.id });
        continue;
      }
      if (existing.target !== target) throw apiError(ErrorCode.IdempotencyKeyReused);
      if (existing.statusCode === null || existing.statusCode === undefined) {
        throw apiError(ErrorCode.RequestInProgress);
      }

      return { claimed: false, statusCode: existing.statusCode, response: existing.response };
    }

    throw apiError(ErrorCode.RequestInProgress);
  }

  /** Keeps the answer the first request got, for any retry of it. */
  async complete(id: string, statusCode: number, response: unknown) {
    await this.keys.update({ id }, { statusCode, response: (response ?? null) as never });
  }

  /** A request that failed keeps nothing: its retry runs again. */
  async release(id: string) {
    await this.keys.delete({ id });
  }

  @Cron('0 40 * * * *', { name: 'idempotency-key-expiry' })
  async expire(now = new Date()) {
    const result = await this.keys.delete({ createdAt: LessThan(new Date(now.getTime() - IDEMPOTENCY_TTL_MS)) });
    if (result.affected) this.logger.log(`Expired ${result.affected} idempotency keys`);
  }
}
