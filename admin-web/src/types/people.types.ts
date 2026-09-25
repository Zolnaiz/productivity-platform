/**
 * The roles the server recognises.
 *
 * This list is the client half of `backend/src/shared/roles.ts`. It used to be
 * its own vocabulary — `owner | admin | manager | employee` — which matched
 * nothing the API would accept, so the role a person was given on this screen
 * and the role the server enforced were unrelated strings.
 */
export const memberRoles = [
  'super_admin',
  'organization_admin',
  'admin',
  'manager',
  'user',
  'viewer',
] as const;

export type MemberRole = (typeof memberRoles)[number];

/** A member of the organization, as the users API returns them. */
export interface TeamUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: MemberRole;
  position?: string;
  phone?: string;
  isActive: boolean;
  organizationId?: string;
  /** Which department they belong to. Empty for somebody in none. */
  departmentId?: string;
}

/** A pending invitation. The token is returned once, at creation, and never again. */
export interface PendingInvitation {
  id: string;
  email: string;
  role: MemberRole;
  invitedBy?: string;
  expiresAt: string;
  createdAt: string;
}

export interface IssuedInvitation {
  invitation: PendingInvitation;
  /** Shown once so it can be copied. Nothing stores it. */
  token: string;
}

/**
 * A part of the organization that owns people and 5S areas.
 *
 * `manager` used to be a typed-in name and `memberCount` a number somebody
 * entered — both invented by the screen that showed them. The manager is now
 * a person who exists, and how many people are in a department is counted
 * from the people.
 */
export interface Department {
  id: string;
  organizationId?: string;
  name: string;
  managerId?: string;
  focusArea?: string;
}

export const memberName = (member: Pick<TeamUser, 'firstName' | 'lastName' | 'email'>) =>
  [member.firstName, member.lastName].filter(Boolean).join(' ').trim() || member.email;
