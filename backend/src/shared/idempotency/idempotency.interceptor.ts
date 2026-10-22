import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';
import { apiError, ErrorCode } from '../errors/api-error';
import { IdempotencyService } from './idempotency.service';

/** What a key may look like: a UUID, or anything of that shape and size. */
const keyPattern = /^[A-Za-z0-9_.:-]{8,100}$/;

/**
 * Makes a POST that carries an `Idempotency-Key` safe to send twice.
 *
 * A client that lost the answer to a write - a timeout on a phone, a
 * dropped connection - sends it again with the same key and gets the first
 * answer back, marked `Idempotent-Replayed: true`, instead of a second
 * copy. Keys belong to the signed-in person, so nobody can read another's
 * answer by guessing theirs. Requests without the header are untouched.
 *
 * Registered inside the response envelope and outside the audit trail, so a
 * replay is wrapped like any answer and is not recorded as a second write.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotency: IdempotencyService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') return next.handle();

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const key = request.headers?.['idempotency-key'];
    const userId: string | undefined = request.user?.id;

    if (request.method !== 'POST' || key === undefined || !userId) return next.handle();
    if (typeof key !== 'string' || !keyPattern.test(key)) {
      throw apiError(ErrorCode.ValidationFailed, 'Idempotency-Key');
    }

    const path = String(request.originalUrl ?? request.url ?? '').split('?')[0];
    const claim = await this.idempotency.claim(userId, key, `POST ${path}`.slice(0, 300));

    if ('statusCode' in claim) {
      response.status?.(claim.statusCode);
      response.setHeader?.('Idempotent-Replayed', 'true');
      return of(claim.response);
    }

    const claimId = claim.id;
    return next.handle().pipe(
      mergeMap(async (body) => {
        const plain = body && typeof body === 'object' ? instanceToPlain(body) : body;
        await this.idempotency.complete(claimId, response.statusCode, plain);
        return body;
      }),
      catchError((error) => from(this.idempotency.release(claimId)).pipe(mergeMap(() => throwError(() => error)))),
    );
  }
}
