import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogEntry } from './entities/audit-log-entry.entity';
import { AuditLogService } from './audit-log.service';
import { API_PREFIX } from '../app-config';
import { summariseChange } from './change-summary';
import { auditBefore } from './audit-context';

const readOnlyMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

/** A route segment that is a parameter rather than a name. */
const isParameter = (segment: string) => segment.startsWith(':');

const byMethod: Record<string, string> = {
  POST: 'created',
  PATCH: 'updated',
  PUT: 'updated',
  DELETE: 'deleted',
};

/**
 * What the route says was done.
 *
 * Two things this has to get right, and both were wrong first time.
 *
 * Express reports `route.path` with the application's global prefix still on
 * it, so every entry claimed to be about a module called `api`. The prefix is
 * stripped here using the same constant that sets it.
 *
 * And a trailing segment is only an action when it comes *after* a parameter:
 * `POST /users/:id/deactivate` is a deactivation, while
 * `PATCH /organizations/my-organization` is an ordinary update of a
 * resource that happens to be named rather than numbered. Without that
 * distinction the second reads as an action called "my-organization".
 *
 * `module` stays the first named segment, because it is what the reader
 * filters by. The precise path is kept in its own column, so nothing is lost.
 */
export const describeRoute = (method: string, routePath: string) => {
  const segments = routePath.split('/').filter(Boolean);
  const withoutPrefix = segments[0] === API_PREFIX ? segments.slice(1) : segments;
  const module = withoutPrefix.find((segment) => !isParameter(segment)) ?? 'unknown';
  const last = withoutPrefix[withoutPrefix.length - 1];
  const previous = withoutPrefix[withoutPrefix.length - 2];

  if (last && !isParameter(last) && previous && isParameter(previous)) {
    return { module, action: last };
  }

  return { module, action: byMethod[method] ?? method.toLowerCase() };
};

/** Deleting something is the entry a reader scans for. */
export const severityFor = (method: string, action: string): AuditLogEntry['severity'] =>
  method === 'DELETE' || action === 'deleted' || action === 'deactivate' ? 'warning' : 'info';

/**
 * Records every change the API accepts.
 *
 * An audit trail assembled by remembering to call a logger is an audit trail
 * with holes in it, and the holes are invisible. This sits in front of every
 * route instead: if a request changed something and succeeded, there is an
 * entry, including on routes nobody thought about when writing this.
 *
 * Reads are skipped — a trail that records every page view buries the changes
 * it exists to show. Failures are skipped too: a refused request changed
 * nothing, and `LoggingInterceptor` already records it.
 *
 * The actor comes from the verified token and the route from Express, so a
 * client cannot write its own history. What the request asked to change is
 * summarised rather than stored: a field whose name says it is a secret keeps
 * its name and loses its value, and anything too large to read is described
 * instead — so a password cannot reach a table people are meant to read, and
 * a floor plan's background image cannot make a row nobody can query. See
 * `change-summary.ts`.
 *
 * What is recorded is the change that was *asked for*, and — where the service
 * making it loaded the record first, which is every update in this application
 * — what those fields held before. An interceptor still never sees the row
 * itself; the service hands over what it is about to overwrite, through an
 * async-local store. See `audit-context.ts`.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly auditLog: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = String(request.method || '').toUpperCase();

    if (readOnlyMethods.has(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        // Nothing in here may disturb the response. `record` swallows its own
        // failures, but this does not rely on that: an unhandled rejection
        // escaping here would take the process down, and a bookkeeping write
        // is never worth an outage.
        try {
          const organizationId = request.user?.organizationId;

          // Registration and sign-in happen before anyone belongs anywhere.
          // There is no organization's trail to write them to.
          if (!organizationId) return;

          const response = context.switchToHttp().getResponse();
          const routePath = String(request.route?.path ?? request.path ?? '');
          const { module, action } = describeRoute(method, routePath);

          this.auditLog
            .record({
              organizationId,
              actorId: request.user?.id,
              actorName:
                [request.user?.firstName, request.user?.lastName].filter(Boolean).join(' ') ||
                request.user?.email,
              actorRole: request.user?.role,
              module,
              action,
              targetId: request.params?.id,
              method,
              route: routePath,
              statusCode: response.statusCode ?? 200,
              severity: severityFor(method, action),
              changes: summariseChange(request.body),
              // What those fields held before, when the service that made the
              // change loaded the record first — which is every update here.
              before: auditBefore(),
            })
            .catch((error) => this.logger.error(`Audit entry rejected: ${(error as Error).message}`));
        } catch (error) {
          this.logger.error(`Audit entry not built: ${(error as Error).message}`);
        }
      }),
    );
  }
}
