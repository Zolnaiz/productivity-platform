import { UserRole } from '../shared/constants';
import { AuditTier } from './audit-tiers';

/**
 * Who a layered audit lands on.
 *
 * Every tier's task went to the zone owner, with a note in the description
 * saying which layer it was. That was honest when there was nobody to resolve
 * a tier's role to — and it meant the supervisor's weekly check and the
 * manager's monthly one arrived in the operator's list, which is the one place
 * they cannot be done from. A layered audit whose whole purpose is that
 * somebody above the work looks at it was being given back to the work.
 *
 * There is somebody to ask now: an area answers to a department, a department
 * has a manager, and a person has a role. So tier one stays with the area's
 * owner, and a tier that expects seniority goes to the department's manager
 * when they have it.
 */

/** Most senior first, which is the order `memberRoles` uses in the browser. */
const seniority = [
  UserRole.SUPER_ADMIN,
  UserRole.ORGANIZATION_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.USER,
  UserRole.VIEWER,
] as string[];

/** Whether `role` is at or above what a layer expects. */
export const coversTier = (role: string | undefined, tier: Pick<AuditTier, 'role'>) => {
  // A layer that names no role names nobody in particular, so anybody covers
  // it: the point of the field is seniority, and an absent field asks for
  // none.
  if (!tier.role) return true;

  const has = seniority.indexOf(role ?? '');
  const needs = seniority.indexOf(tier.role);

  return has >= 0 && needs >= 0 && has <= needs;
};

export interface TierCandidate {
  id?: string;
  role?: string;
}

/**
 * The person a tier's audit task is given to.
 *
 * The area's owner first, whenever the layer is within their level. The daily
 * check belongs to whoever works there — handing it up to a manager would be
 * the same mistake in the other direction, and a supervisor doing the
 * operator's check is not the operator's check.
 *
 * Only when the owner is not senior enough does it go to the department's
 * manager, which is what a layered audit is for: somebody above the work
 * looking at it. If neither covers the layer it stays with the owner — a task
 * nobody is named on is a task nobody does, and the layer is named in the task
 * either way, so whoever gets it can see what it is and pass it on.
 */
export const assigneeForTier = (
  tier: Pick<AuditTier, 'role'>,
  candidates: { owner?: TierCandidate | null; departmentManager?: TierCandidate | null },
): string | undefined => {
  const { owner, departmentManager } = candidates;

  if (owner?.id && coversTier(owner.role, tier)) {
    return owner.id;
  }

  if (departmentManager?.id && coversTier(departmentManager.role, tier)) {
    return departmentManager.id;
  }

  return owner?.id;
};
