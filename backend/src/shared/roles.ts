import { UserRole } from './constants';

/**
 * Which roles each role may hand out.
 *
 * There is one table because there is one rule. It was written twice before —
 * once for invitations and once for changing an existing member's role — and
 * the two copies disagreed: an organization admin could invite a manager but
 * could not promote a colleague to manager, and `manager` and `viewer` were
 * missing from the second table entirely.
 *
 * The rule is that you may only assign a role strictly below your own. Nobody
 * can hand out their own level, so no path through the API produces a second
 * super admin — that seat is created by seeding and by nothing else.
 */
const assignableRoles: Record<string, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [
    UserRole.ORGANIZATION_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.USER,
    UserRole.VIEWER,
  ],
  [UserRole.ORGANIZATION_ADMIN]: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.VIEWER],
  [UserRole.ADMIN]: [UserRole.MANAGER, UserRole.USER, UserRole.VIEWER],
  [UserRole.MANAGER]: [UserRole.USER, UserRole.VIEWER],
  [UserRole.USER]: [],
  [UserRole.VIEWER]: [],
};

/** The roles `actor` is allowed to grant. Empty for anyone who grants nothing. */
export const rolesAssignableBy = (actor: string | undefined): UserRole[] =>
  assignableRoles[actor ?? ''] ?? [];

/** Whether `actor` may set somebody's role to `target`. */
export const canAssignRole = (actor: string | undefined, target: UserRole): boolean =>
  rolesAssignableBy(actor).includes(target);

/**
 * What each role may do.
 *
 * This list used to be a hint the client read to decide which buttons to draw,
 * while the server checked nothing beyond "is this person signed in" — so a
 * viewer who sent the request by hand could delete a project. It is now what
 * `PermissionsGuard` enforces on every operations route, which means the
 * buttons the client hides and the requests the server refuses come from the
 * same table and cannot drift apart.
 *
 * The roles nest: everything a user may do, a manager may do. Writing them
 * cumulatively is what makes that true rather than merely intended.
 */
const viewer = [
  // An inbox is personal, so every role that can sign in has one — including
  // the viewer, who is told when an audit they have to walk is due.
  'notifications:read',
  'notifications:update',
  'projects:read',
  'tasks:read',
  'audits:read',
  'templates:read',
  'zones:read',
  'attachments:read',
  'reports:read',
];

const user = [
  ...viewer,
  'tasks:update',
  'worklogs:read',
  'worklogs:create',
  'time:read',
  'time:create',
  'goals:read',
  'goals:create',
  'goals:update',
  'expenses:read',
  'expenses:create',
  'audits:create',
  'attachments:create',
  // Red-tagging is the one thing on a 5S programme that has to be open to
  // whoever is standing in front of the clutter. It is deliberately not
  // `zones:update`: an operator may say "this does not belong here" without
  // being able to move a wall.
  'redtags:create',
  // Recording that an area was cleaned belongs to whoever cleaned it. Like
  // red-tagging, it is deliberately not `zones:update`: it writes one date
  // and nothing else.
  'zones:clean',
];

const manager = [
  ...user,
  'projects:create',
  'projects:update',
  'tasks:create',
  'tasks:delete',
  'audits:update',
  'zones:update',
  'expenses:update',
  'attachments:delete',
  'users:read',
  // A line manager may bring an operator onto their own shift. The role
  // hierarchy above already limits them to `user` and `viewer`; revoking
  // somebody else's pending invitation stays with administrators.
  'invitations:read',
  'invitations:create',
];

const admin = [
  ...manager,
  'projects:delete',
  'zones:create',
  'zones:delete',
  'templates:create',
  'templates:update',
  'templates:delete',
  'users:update',
  'users:delete',
  'invitations:delete',
];

const organizationAdmin = [...admin, 'organization:update', 'auditlog:read'];

const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    ...organizationAdmin,
    'organizations:read',
    'organizations:create',
    'organizations:update',
    'organizations:delete',
  ],
  [UserRole.ORGANIZATION_ADMIN]: organizationAdmin,
  [UserRole.ADMIN]: admin,
  [UserRole.MANAGER]: manager,
  [UserRole.USER]: user,
  [UserRole.VIEWER]: viewer,
};

/** Everything this role may do. Empty for a role nobody recognises. */
export const permissionsFor = (role: string | undefined): string[] =>
  rolePermissions[role as UserRole] ?? [];

/** Whether this role may do this one thing. */
export const hasPermission = (role: string | undefined, permission: string): boolean =>
  permissionsFor(role).includes(permission);

/** Every permission the table names, for tests that check routes against it. */
export const allPermissions = (): string[] => [
  ...new Set(Object.values(rolePermissions).flat()),
];
