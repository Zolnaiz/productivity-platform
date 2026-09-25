import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

/**
 * The one thing a route needs the caller to be allowed to do.
 *
 * Names come from the table in `shared/roles.ts`; `PermissionsGuard` refuses
 * the request when the caller's role does not carry the name, and a spec
 * checks that every name a route asks for is one the table actually defines,
 * so a typo is a failing test rather than a route nobody can reach.
 */
export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);
