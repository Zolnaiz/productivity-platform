import { FiveSGuidelineContent } from '../types/fiveS.types';

/**
 * The 5S standard the demo workspace works to.
 *
 * Deliberately a sample rather than a copy. The real thing — a customer's
 * cadence, their folder-colour rules, thirty-five assessment criteria — is
 * seed data on the server, and keeping a second copy of it here is how the two
 * come to disagree about what the standard says. What the demo needs is enough
 * of each register to show what the page is for.
 */
export const demoGuidelineContent: FiveSGuidelineContent = {
  operatingCadence: [
    {
      title: 'Daily 5S',
      timing: '10–15 minutes, every day',
      detail: 'Everyone tidies the area they own and the shared space beside it.',
    },
    {
      title: 'Monthly sort',
      timing: 'First week of the month',
      detail: 'Sort what is needed from what is not, and decide where the rest goes.',
    },
    {
      title: 'Audit handoff',
      timing: 'Last week of the month',
      detail: 'Areas, labels, owners and standards go to the audit process to be checked.',
    },
  ],
  labelStandards: [
    'Every person owns a working area and a share of the common space.',
    'Items have agreed names, and every position is labelled.',
    'Shared cabinets and shelves carry the item names on the right.',
  ],
  assessmentCriteria: [
    { id: 'policy-1', category: '5S policy', criterion: 'The 5S policy is written down and approved.' },
    { id: 'policy-2', category: '5S policy', criterion: 'Everybody can say what it asks of them.' },
    { id: 'corner-1', category: '5S board', criterion: 'The board is somewhere people actually pass.' },
    { id: 'corner-2', category: '5S board', criterion: 'What is on it is current.' },
    { id: 'teams-1', category: 'Teams', criterion: 'Each team has a name and a named membership.' },
    { id: 'audit-1', category: 'Assessment', criterion: 'The internal audit runs on a stated rhythm.' },
  ],
  publicChecklistGroups: [
    {
      code: 'seiri',
      title: '1. Sort',
      items: [
        'No waste, dirt or unnecessary items in the working area.',
        'Equipment is in use and undamaged.',
        'There is a written cleaning routine and a standard to hold it to.',
      ],
    },
    {
      code: 'seiton',
      title: '2. Set in order',
      items: [
        'Tools and materials are kept in agreed places.',
        'Every shared item has an owner.',
        'Signs, markings and safety notices are in place and legible.',
      ],
    },
    {
      code: 'seiso',
      title: '3. Shine',
      items: [
        'Floors and corners are clean, including the ones nobody looks at.',
        'Equipment is clean, safe and free of damage.',
        'Cleaning happens to the schedule rather than when somebody notices.',
      ],
    },
    {
      code: 'seiketsu',
      title: '4. Standardize',
      items: [
        'The standard is visible where the work happens.',
        'People can say what their part in it is.',
        'Improvements are written down rather than remembered.',
      ],
    },
    {
      code: 'shitsuke',
      title: '5. Sustain',
      items: [
        '5S is a standing item at team meetings.',
        'Everybody knows the routine and follows it without being asked.',
        'The programme is reviewed, and the review changes something.',
      ],
    },
  ],
  // Six criteria at five points each, plus the fifteen checklist items.
  maxScore: 45,
};
