/**
 * The link on a zone's label, and the square that carries it.
 *
 * A 5S label on a wall says what belongs in the area and who owns it. What it
 * cannot say is what the standard is in full, what is still red-tagged, or
 * when the area was last audited — and somebody standing in front of it with a
 * phone is exactly the person who wants to know.
 *
 * So the label carries a code that opens that zone. The link has to survive
 * being printed and stuck to a wall for a year, which is why it names the plan
 * and the zone rather than carrying a token: nothing to expire, nothing to
 * leak, and a label that still works after the plan is edited.
 */

import qrcode from 'qrcode-generator';

/**
 * Where a zone's label points.
 *
 * A path rather than a full URL when no origin is given, so the same function
 * serves a link inside the application and a code printed from it.
 */
export const zonePath = (planId: string, zoneId: string) =>
  `/zone/${encodeURIComponent(planId)}/${encodeURIComponent(zoneId)}`;

export const zoneUrl = (origin: string, planId: string, zoneId: string) =>
  `${origin.replace(/\/+$/, '')}${zonePath(planId, zoneId)}`;

export interface QrCode {
  /** How many modules across the code is; it is always square. */
  size: number;
  /** One SVG path covering every dark module, so a code is one element. */
  path: string;
}

/**
 * A QR code as an SVG path, in module units.
 *
 * Drawn as paths rather than as an image because a label is printed: a path
 * stays crisp at whatever size the sheet puts it, and a raster at 96 dpi does
 * not. One path for the whole code rather than a rectangle per module keeps a
 * sheet of forty labels to forty elements instead of forty thousand.
 *
 * Error correction M — about 15% — because a label on a workshop wall collects
 * dust and forklift scuffs, and a code that stops scanning the first time
 * somebody brushes it is not worth printing.
 */
export const qrPath = (text: string): QrCode => {
  const code = qrcode(0, 'M');
  code.addData(text);
  code.make();

  const size = code.getModuleCount();
  const parts: string[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (code.isDark(row, column)) parts.push(`M${column} ${row}h1v1h-1z`);
    }
  }

  return { size, path: parts.join('') };
};
