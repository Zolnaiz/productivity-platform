import { MonthlyPerson } from '../../types/operations.types';
import { Department, TeamUser } from '../../types/people.types';
import { FiveSLayoutPlan, FiveSZone } from '../../types/fiveS.types';
import { isAuditDue } from '../fives/auditSchedule';
import { isOpenRedTag } from '../fives/floorPlanRules';

/**
 * How a department is doing, from what its people and its areas recorded.
 *
 * The monthly report answers "how is Sara doing" and the room register answers
 * "how is room 2 doing". Neither could answer "how is Assembly doing", which
 * is the question a plant manager actually asks — people move between areas,
 * areas outlast the people in them, and a department is the one grouping that
 * survives both.
 *
 * Nothing here is a new measurement. It is the same records the per-person
 * table is built from and the same zone fields the floor plan is coloured by,
 * added up along the one axis that was missing.
 */
export interface DepartmentMonth {
  /** Empty for the row that collects everything belonging to no department. */
  departmentId: string;
  name: string;
  people: number;
  completedTasks: number;
  assignedTasks: number;
  hours: number;
  auditRuns: number;
  zones: number;
  /** Undefined when no area of this department has ever been audited. */
  averageAuditScore?: number;
  openRedTags: number;
  /** Areas whose next audit date has passed, or which have never had one. */
  auditsDue: number;
}

const blank = (departmentId: string, name: string): DepartmentMonth => ({
  departmentId,
  name,
  people: 0,
  completedTasks: 0,
  assignedTasks: 0,
  hours: 0,
  auditRuns: 0,
  zones: 0,
  openRedTags: 0,
  auditsDue: 0,
});

export interface DepartmentRollupInput {
  departments: Department[];
  members: TeamUser[];
  /** One row per person, as the report already compiles them. */
  people: MonthlyPerson[];
  /** Every floor: a department is rarely confined to one. */
  plans: FiveSLayoutPlan[];
  /** For "is this audit due"; injectable so a test is not tied to today. */
  today?: string;
}

/**
 * One row per department, plus one for everything that belongs to none.
 *
 * The unassigned row is not tidiness — without it the columns quietly stop
 * adding up to the per-person table above them, and a reader who checks is
 * left believing one of the two is wrong.
 */
export const summariseDepartments = ({
  departments,
  members,
  people,
  plans,
  today,
}: DepartmentRollupInput): DepartmentMonth[] => {
  const rows = new Map<string, DepartmentMonth>();
  const known = new Set(departments.map((department) => department.id));

  departments.forEach((department) => {
    rows.set(department.id, blank(department.id, department.name));
  });

  /*
    A department that has been retired still has people and areas pointing at
    it — deliberately, because dissolving one does not un-happen. Anything
    pointing at a department nobody can name is counted as unassigned, which is
    what a reader would call it.
  */
  const rowFor = (departmentId: string | undefined) => {
    const id = departmentId && known.has(departmentId) ? departmentId : '';

    if (!rows.has(id)) {
      rows.set(id, blank('', 'unassigned'));
    }

    return rows.get(id) as DepartmentMonth;
  };

  const monthOf = new Map(people.map((person) => [person.userId, person]));

  members.forEach((member) => {
    const row = rowFor(member.departmentId);
    row.people += 1;

    const month = monthOf.get(member.id);
    if (!month) return;

    row.completedTasks += month.completedTasks;
    row.assignedTasks += month.assignedTasks;
    row.hours += month.hours;
    row.auditRuns += month.auditRuns;
  });

  const scores = new Map<string, number[]>();

  plans.forEach((plan) =>
    (plan.zones ?? []).forEach((zone: FiveSZone) => {
      const row = rowFor(zone.departmentId);
      row.zones += 1;
      row.openRedTags += (zone.redTags ?? []).filter(isOpenRedTag).length;

      if (isAuditDue(zone, today)) {
        row.auditsDue += 1;
      }

      if (typeof zone.lastAuditScore === 'number') {
        const collected = scores.get(row.departmentId) ?? [];
        collected.push(zone.lastAuditScore);
        scores.set(row.departmentId, collected);
      }
    }),
  );

  rows.forEach((row) => {
    const collected = scores.get(row.departmentId) ?? [];

    // Left undefined rather than shown as zero: an area nobody has audited is
    // not an area scoring nothing, and a department of unaudited areas would
    // otherwise sit at the bottom of the table looking like the worst one.
    row.averageAuditScore = collected.length
      ? Math.round(collected.reduce((sum, score) => sum + score, 0) / collected.length)
      : undefined;
  });

  return [...rows.values()].sort((a, b) => {
    // The unassigned row last, wherever its numbers put it: it is a gap in the
    // records rather than a part of the organization.
    if (!a.departmentId) return 1;
    if (!b.departmentId) return -1;

    return a.name.localeCompare(b.name);
  });
};
