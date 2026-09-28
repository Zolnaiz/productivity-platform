export interface SetupFacts {
  profileComplete: boolean;
  departments: number;
  people: number;
  invitations: number;
  zones: number;
  zonesWithOwner: number;
  checklists: number;
  audits: number;
}

export interface SetupStep {
  key: 'profile' | 'departments' | 'people' | 'plan' | 'owners' | 'checklist' | 'audit';
  done: boolean;
  path: string;
}

/**
 * What a new organization does before the application is any use to it, in
 * the order it has to be done: say who it is, how it is divided, who works
 * there, what its areas are and who owns them, what they are checked
 * against, and walk the first check. Each step is read from what is already
 * there, so a step done elsewhere is done here too.
 */
export const setupSteps = (facts: SetupFacts): SetupStep[] => [
  { key: 'profile', done: facts.profileComplete, path: '/organizations' },
  { key: 'departments', done: facts.departments > 0, path: '/departments' },
  // Somebody besides the person setting up, or somebody on the way.
  { key: 'people', done: facts.people > 1 || facts.invitations > 0, path: '/users' },
  { key: 'plan', done: facts.zones > 0, path: '/fives' },
  { key: 'owners', done: facts.zones > 0 && facts.zonesWithOwner === facts.zones, path: '/fives?view=areas' },
  { key: 'checklist', done: facts.checklists > 0, path: '/audit-templates' },
  { key: 'audit', done: facts.audits > 0, path: '/fives' },
];
