/**
 * The plan's own colours, in daylight and at night.
 *
 * The rest of the application has a dark mode. The floor plan did not: it was
 * a sheet of pure white with black walls, so turning the lights off left one
 * blazing rectangle in the middle of a dark page — the single brightest thing
 * on screen, in the part of the screen people look at longest.
 *
 * The plan is a drawing, so the fix is the one a drawing wants: keep the
 * relationships and invert the range. Dark paper, light ink, a grid that stays
 * quiet against both. Colours that carry meaning — a zone's own colour, a red
 * tag's red — keep their hue; only their brightness moves, because those hues
 * are how somebody finds the thing they are looking for.
 *
 * Exports and prints are not affected: a plan leaving the editor is going onto
 * white paper whatever theme it was drawn in, so those force the light set.
 */

export interface CanvasColours {
  /** The sheet itself. */
  paper: string;
  /** The grid ruled on it. */
  grid: string;
  /** Walls, corners and outlines. */
  ink: string;
  /** The floor of a room, behind everything standing on it. */
  roomFill: string;
  /** The room's own outline when it is selected. */
  roomSelected: string;
  /** Dimensions, scale bar, and the quiet marks around the drawing. */
  measure: string;
  /** How far anything drawn in a hue has to shift to sit on this paper. */
  dark: boolean;
}

const light: CanvasColours = {
  paper: '#ffffff',
  grid: '#d1d5db',
  ink: '#1f2937',
  roomFill: '#0f172a08',
  roomSelected: '#2563eb',
  measure: '#334155',
  dark: false,
};

const dark: CanvasColours = {
  // Darker than the card it sits in, so the canvas reads as a well rather
  // than as another panel.
  paper: '#0b1220',
  grid: '#1e293b',
  ink: '#e2e8f0',
  roomFill: '#ffffff0a',
  roomSelected: '#60a5fa',
  measure: '#94a3b8',
  dark: true,
};

export const canvasColours = (isDark: boolean): CanvasColours => (isDark ? dark : light);

/**
 * A fill that was chosen for white paper, put onto this paper.
 *
 * The pastels the furniture is drawn in — a blue desk top, an amber pallet —
 * are light by construction, so on dark paper they would be the brightest
 * things in the room. Dropped to a low alpha they keep their hue and let the
 * paper through, which is what a tint is for.
 */
export const tint = (hex: string, colours: CanvasColours) =>
  colours.dark ? `${hex}2e` : hex;

/**
 * An outline that was chosen for white paper, put onto this paper.
 *
 * Outlines have to hold their contrast or the drawing falls apart, and a
 * mid-brown line on dark paper does not. So at night every outline becomes
 * ink: it is what a drawing looks like when it is white on black, and the
 * colour it lost was never carrying the meaning — the fill it encloses is.
 */
export const strokeInk = (hex: string, colours: CanvasColours) =>
  colours.dark ? colours.ink : hex;

/**
 * A hue that does carry meaning — a zone's colour, a red tag's red.
 *
 * Kept, because it is how somebody finds the thing they are looking for, and
 * because two zones are told apart by hue and nothing else.
 */
export const meaningful = (hex: string) => hex;
