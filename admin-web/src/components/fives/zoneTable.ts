import type { FiveSZone } from '../../types/fiveS.types';

/**
 * Rules for the 5S area table.
 *
 * The table is the default way to set up areas: one row per area, typed like
 * a spreadsheet. The drawing editor stays for whoever wants a floor plan, so
 * a zone made here needs a place on the canvas too - it gets one in a simple
 * grid, out of the way of anything already drawn.
 */

export type ZoneProblem = 'nameRequired' | 'codeRequired' | 'codeDuplicate' | 'areaInvalid';

/** What is wrong with each row, keyed by zone id. Empty when the table can be saved. */
export const zoneProblems = (zones: FiveSZone[]): Record<string, ZoneProblem[]> => {
  const counts = new Map<string, number>();
  for (const zone of zones) {
    const code = zone.code.trim().toUpperCase();
    if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  const problems: Record<string, ZoneProblem[]> = {};
  for (const zone of zones) {
    const found: ZoneProblem[] = [];
    if (!zone.name.trim()) found.push('nameRequired');
    const code = zone.code.trim().toUpperCase();
    if (!code) found.push('codeRequired');
    else if ((counts.get(code) ?? 0) > 1) found.push('codeDuplicate');
    const area = zone.areaSquareMetres;
    if (area !== undefined && (!Number.isFinite(area) || area < 0)) found.push('areaInvalid');
    if (found.length) problems[zone.id] = found;
  }
  return problems;
};

/** The next free code, A01, A02, ... - whatever the highest number in use is, plus one. */
export const nextCode = (zones: FiveSZone[]) => {
  const highest = zones.reduce((max, zone) => {
    const value = Number(zone.code.replace(/^\D+/, ''));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `A${String(highest + 1).padStart(2, '0')}`;
};

const COLOURS = ['#38bdf8', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#14b8a6', '#64748b'];
const CELL = { width: 190, height: 118, gap: 24, perRow: 4 };

/**
 * A new row. Placed in a grid below everything already on the canvas, so the
 * drawing editor shows it without covering another area.
 */
export const newZone = (zones: FiveSZone[], name: string, id = `zone-${Date.now()}`): FiveSZone => {
  const bottom = zones.reduce((max, zone) => Math.max(max, zone.y + zone.height), 0);
  const index = zones.length;
  const column = index % CELL.perRow;
  return {
    id,
    code: nextCode(zones),
    name,
    color: COLOURS[index % COLOURS.length],
    x: 40 + column * (CELL.width + CELL.gap),
    y: (bottom ? bottom + CELL.gap : 40),
    width: CELL.width,
    height: CELL.height,
    contents: '',
    standard: '',
    labelText: '',
    stage: 'sort',
    auditFrequency: 'weekly',
  };
};
