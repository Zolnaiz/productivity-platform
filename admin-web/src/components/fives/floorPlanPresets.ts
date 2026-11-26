/**
 * The floor plan editor's fixed choices: the palette's icons, the preset
 * colours and area templates, the colours routes are drawn in, and the class
 * every text field shares. Read by FiveSFloorPlanSetup and the panels split
 * out of it (the palette and the inspectors); nothing here changes at run time.
 */
import React from 'react';
import { ClipboardList, Move, Package, Plus, Printer, Square, Table, Trash2 } from 'lucide-react';
import { FiveSZone, FloorPlanObjectType } from '../../types/fiveS.types';

/**
 * The palette, drawn from the catalogue.
 *
 * It used to carry a Wall and a Door of its own: black rectangles that looked
 * like a building and were not one. Nothing closed a room, nothing had an
 * area, and a door drawn that way was a picture of a door over a solid wall.
 * Both are tools now — walls are drawn and openings are cut — and leaving the
 * old pair in the palette would leave two ways to draw a wall, one of which
 * quietly does nothing.
 *
 * Old plans still containing them keep drawing them; they simply cannot be
 * added any more.
 */
export const shapeIcons: Partial<Record<FloorPlanObjectType, React.ComponentType<{ className?: string }>>> = {
  desk: Table,
  chair: Move,
  table: ClipboardList,
  sofa: Square,
  shelf: Package,
  cabinet: Package,
  pallet: Package,
  racking: Package,
  workbench: Table,
  printer: Printer,
  equipment: Move,
  whiteboard: Square,
  plant: Plus,
  waste_bin: Trash2,
  sink: Square,
};


/** What each preset colour marks; worded on the page as `fiveS.colorPreset.<key>`. */
export const zoneColorPresets = [
  { key: 'front', value: '#38bdf8' },
  { key: 'work', value: '#22c55e' },
  { key: 'storage', value: '#f59e0b' },
  { key: 'meeting', value: '#a855f7' },
  { key: 'break', value: '#ef4444' },
  { key: 'shared', value: '#14b8a6' },
  { key: 'support', value: '#64748b' },
];

/**
 * The area presets, named by key rather than by an English string.
 *
 * A Mongolian workspace was being offered buttons called Reception and
 * Workstations, and the areas they created came out with English names that
 * somebody then had to retype. The preset's `key` is what the palette and the
 * new area are both named from.
 */
export const zoneTemplates: Array<
  Pick<FiveSZone, 'color' | 'width' | 'height' | 'contents' | 'standard' | 'labelText' | 'stage'> & { key: string }
> = [
  {
    key: 'reception',
    color: '#38bdf8',
    width: 210,
    height: 126,
    contents: 'Visitor desk, waiting chairs, incoming document tray',
    standard: 'Front desk clear, visitor chairs aligned, incoming documents sorted daily.',
    labelText: 'Reception owner and visitor standard visible',
    stage: 'set_in_order',
  },
  {
    key: 'workstations',
    color: '#22c55e',
    width: 310,
    height: 190,
    contents: 'Employee desks, laptops, stationery, shared printer access',
    standard: 'Only active work items on desks, cables tied, shared items returned to labeled place.',
    labelText: 'Desk standard photo and cable labels',
    stage: 'shine',
  },
  {
    key: 'storage',
    color: '#f59e0b',
    width: 220,
    height: 160,
    contents: 'Office supplies, PPE, spare labels, cleaning tools',
    standard: 'Shelf positions labeled, min/max stock visible, red-tag box checked weekly.',
    labelText: 'Shelf labels and red-tag location',
    stage: 'sort',
  },
  {
    key: 'meetingRoom',
    color: '#a855f7',
    width: 190,
    height: 150,
    contents: 'Meeting table, chairs, screen, whiteboard markers',
    standard: 'Table clear after each meeting, chairs reset, markers tested.',
    labelText: 'Meeting reset standard',
    stage: 'standardize',
  },
  {
    key: 'breakArea',
    color: '#ef4444',
    width: 220,
    height: 120,
    contents: 'Coffee machine, sink, fridge, waste bins',
    standard: 'Counters wiped, food labeled, waste bins emptied, spill kit visible.',
    labelText: 'Food and cleaning labels',
    stage: 'shine',
  },
  {
    key: 'archive',
    color: '#14b8a6',
    width: 210,
    height: 132,
    contents: 'Document folders, binders, archive boxes',
    standard: 'Folder names follow naming rule, archive index visible, obsolete documents red-tagged.',
    labelText: 'Archive index and folder color rule',
    stage: 'set_in_order',
  },
  {
    key: 'walkway',
    color: '#64748b',
    width: 260,
    height: 86,
    contents: 'Common passage, emergency route, shared access',
    standard: 'Walkway clear, emergency route visible, no temporary storage.',
    labelText: 'Keep clear',
    stage: 'standardize',
  },
];

/**
 * Colours for the paths, in order.
 *
 * Several routes on one plan is the point of the exercise — the operator's
 * walk against the trolley's — so they have to be told apart at a glance, and
 * the first one drawn must not change colour when the second is added.
 */
export const routeColours = ['#ef4444', '#2563eb', '#16a34a', '#a855f7', '#f59e0b', '#0891b2'];

export const fieldClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900';
