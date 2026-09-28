import { describe, expect, it } from 'vitest';
import { setupSteps } from './setupSteps';

const fresh = {
  profileComplete: false,
  departments: 0,
  people: 1,
  invitations: 0,
  zones: 0,
  zonesWithOwner: 0,
  checklists: 0,
  audits: 0,
};

describe('getting started', () => {
  it('has everything to do for a new organization, in order', () => {
    const steps = setupSteps(fresh);
    expect(steps.map((step) => step.key)).toEqual(['profile', 'departments', 'people', 'plan', 'owners', 'checklist', 'audit']);
    expect(steps.every((step) => !step.done)).toBe(true);
  });

  it('counts people on the way as people', () => {
    expect(setupSteps({ ...fresh, invitations: 2 }).find((step) => step.key === 'people')?.done).toBe(true);
  });

  it('does not count the owners done while any area has none', () => {
    const owners = (zones: number, zonesWithOwner: number) =>
      setupSteps({ ...fresh, zones, zonesWithOwner }).find((step) => step.key === 'owners')?.done;
    expect(owners(0, 0)).toBe(false);
    expect(owners(5, 4)).toBe(false);
    expect(owners(5, 5)).toBe(true);
  });
});
