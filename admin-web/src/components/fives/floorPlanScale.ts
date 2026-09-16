import { GRID_SIZE } from './floorPlanGeometry';

/**
 * How big things actually are.
 *
 * Until this existed a zone was a rectangle of `width: 200` — two hundred of
 * nothing. The plan carried a `scale` field, but it held free text like
 * `"1 square = 1 meter"`: a note to the reader that no code could act on. So
 * the editor could draw an office and could not say how large any part of it
 * was, which is most of what a floor plan is for.
 *
 * It is not cosmetic. An area in square metres is what lets a 5S score mean
 * something across rooms of different sizes, what makes red tags per square
 * metre comparable between a store and a line, what lets a label sheet print
 * to scale, and what a spaghetti diagram would need to report a walking
 * distance in metres rather than in pixels.
 *
 * One number does all of it: how many metres one canvas unit covers.
 */

/**
 * One grid square is one metre.
 *
 * Chosen because it is what the old free-text scale already claimed, so plans
 * drawn before this arrive at the size their author was picturing rather than
 * at some arbitrary reinterpretation. It puts the 900×500 canvas at 37.5 m by
 * 20.8 m — a plausible office floor or small production hall.
 */
export const DEFAULT_METRES_PER_UNIT = 1 / GRID_SIZE;

/** Below this a plan is unusable, above it the numbers stop being credible. */
const MIN_METRES_PER_UNIT = 1 / 2000;
const MAX_METRES_PER_UNIT = 10;

export const clampScale = (metresPerUnit: number) =>
  Math.min(MAX_METRES_PER_UNIT, Math.max(MIN_METRES_PER_UNIT, metresPerUnit));

/** A plan with no scale recorded is read at the default rather than as zero. */
export const scaleOf = (plan?: { metresPerUnit?: number } | null) =>
  plan?.metresPerUnit && Number.isFinite(plan.metresPerUnit) && plan.metresPerUnit > 0
    ? clampScale(plan.metresPerUnit)
    : DEFAULT_METRES_PER_UNIT;

export const toMetres = (units: number, metresPerUnit: number) => units * metresPerUnit;

export const toUnits = (metres: number, metresPerUnit: number) =>
  metresPerUnit > 0 ? metres / metresPerUnit : 0;

/**
 * A length, written the way somebody would say it.
 *
 * Under a metre reads in centimetres, because "0.4 m" is how a drawing tool
 * talks and "40 cm" is how a person does. Above that, one decimal: a floor
 * plan drawn by dragging is not accurate to the millimetre and printing four
 * digits would claim it was.
 */
export const formatLength = (metres: number) => {
  if (!Number.isFinite(metres)) return '—';
  if (Math.abs(metres) < 1) return `${Math.round(metres * 100)} cm`;

  return `${metres.toFixed(1)} m`;
};

/** An area in square metres, rounded the same way and for the same reason. */
export const formatArea = (squareMetres: number) => {
  if (!Number.isFinite(squareMetres)) return '—';

  return `${squareMetres.toFixed(1)} m²`;
};

export interface Sized {
  width: number;
  height: number;
}

export const areaOf = (box: Sized, metresPerUnit: number) =>
  toMetres(box.width, metresPerUnit) * toMetres(box.height, metresPerUnit);

/** `6.4 × 4.2 m`, for a label that has room for one line. */
export const formatSize = (box: Sized, metresPerUnit: number) =>
  `${toMetres(box.width, metresPerUnit).toFixed(1)} × ${toMetres(box.height, metresPerUnit).toFixed(1)} m`;

/**
 * The scale implied by measuring something of known length.
 *
 * This is how a plan gets its real size: import the building's drawing as a
 * background, draw a line along a wall somebody has measured, and say what it
 * is. Everything already on the plan resizes with it, which is the point —
 * calibrating after drawing must not mean redrawing.
 */
export const calibrate = (lengthInUnits: number, realMetres: number) => {
  if (lengthInUnits <= 0 || realMetres <= 0) return null;

  return clampScale(realMetres / lengthInUnits);
};

/**
 * A round number of metres to draw a scale bar for.
 *
 * Picks 1, 2, 5, 10, 20, 50… — the same series every map legend uses, because
 * a bar labelled "7.3 m" is unreadable at a glance and one labelled "5 m" is
 * not.
 */
export const niceBarLength = (visibleMetres: number) => {
  const target = visibleMetres / 4;
  if (target <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(target));
  const steps = [1, 2, 5, 10];
  const step = steps.find((value) => target <= value * magnitude) ?? 10;

  return step * magnitude;
};
