import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { apiError, ErrorCode } from '../errors/api-error';
import { PERMISSION_KEY } from '../decorators/permissions.decorator';
import { hasPermission } from '../roles';

/**
 * Refuses a request the caller's role does not carry a permission for.
 *
 * Until this existed, every operations route accepted any signed-in member of
 * the organization: a viewer could delete a project, and a user could rewrite
 * the audit templates the whole plant is scored against. The client hid those
 * controls, which is not the same as the server refusing them.
 *
 * A route with no `@RequirePermission` is left alone — reads that everybody in
 * the organization may make do not need to name a permission to allow one.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // `ALLOW_PUBLIC_OPERATIONS` is a development switch that lets an
    // unauthenticated request through the auth guard. There is no role to
    // check in that case, and re-reading the flag here would be a second
    // place for it to be wrong — the auth guard marks what it decided.
    if (request.anonymousOperations) {
      return true;
    }

    if (!hasPermission(request.user?.role, required)) {
      throw apiError(ErrorCode.AccessDenied, required);
    }

    return true;
  }
}
