/**
 * Where the demo workspace keeps its floor plans.
 *
 * It kept exactly one, under a key that said so, and that was the shape of the
 * demo rather than of the product: a building has a plan per floor, an
 * organization can have more than one building, and none of that was visible
 * to somebody evaluating the product without standing up a backend. Worse, the
 * two services that touch plans each reached for that one key, so an audit
 * recorded against a zone would have repainted whichever plan was stored —
 * the same fault the server had and had fixed.
 *
 * So the store is here, once: a list, the plan holding a given zone, and the
 * migration from the single-plan key that existing browsers still hold.
 */

export const DEMO_PLANS_KEY = 'productivity-demo-5s-layouts';

/** What the demo used to keep. Read once, to carry somebody's work forward. */
const LEGACY_PLAN_KEY = 'productivity-demo-5s-layout';

/**
 * The little this store needs to know about a plan.
 *
 * Deliberately not the full type: one caller holds `FiveSLayoutPlan` and the
 * other holds loose JSON it never typed, and a store that insisted on the
 * richer shape would push a cast into both of them.
 */
type Plan = { id?: string; zones?: Array<{ id?: string } | Record<string, unknown>> };

const parse = <T>(raw: string | null): T | null => {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

/**
 * The plans this browser holds, or null when it holds none.
 *
 * A browser that still has the single-plan key gets that plan as the list: a
 * demo somebody has drawn on is their work, and dropping it to seed fresh
 * fixtures would be the one thing they would notice.
 */
export const readDemoPlans = <T extends Plan>(): T[] | null => {
  const stored = parse<T[]>(localStorage.getItem(DEMO_PLANS_KEY));

  if (Array.isArray(stored) && stored.length) {
    return stored;
  }

  const legacy = parse<T>(localStorage.getItem(LEGACY_PLAN_KEY));

  if (legacy && typeof legacy === 'object') {
    writeDemoPlans([legacy]);
    localStorage.removeItem(LEGACY_PLAN_KEY);

    return [legacy];
  }

  return null;
};

export const writeDemoPlans = <T extends Plan>(plans: T[]) => {
  try {
    localStorage.setItem(DEMO_PLANS_KEY, JSON.stringify(plans));
  } catch {
    // A full or unwritable store is not a reason to fail the action; the demo
    // is a demonstration, and losing it costs nobody their records.
  }

  return plans;
};

/**
 * The plan a zone is on.
 *
 * Not the first plan: an audit of an area upstairs must not repaint the ground
 * floor, which is exactly the fault the server had when a building first got a
 * second plan.
 */
export const planHoldingZone = <T extends Plan>(plans: T[], zoneId: string | undefined) =>
  zoneId ? (plans.find((plan) => (plan.zones ?? []).some((zone) => zone.id === zoneId)) ?? null) : null;

/** Replaces one plan in the list, matched by id. */
export const replaceDemoPlan = <T extends Plan>(plans: T[], plan: T) =>
  plans.map((candidate) => (candidate.id === plan.id ? plan : candidate));
