import { describe, expect, it } from 'vitest';
import { canvasColours, strokeInk, tint } from './floorPlanTheme';

describe('the plan at night', () => {
  const day = canvasColours(false);
  const night = canvasColours(true);

  it('stops being the brightest thing on a dark page', () => {
    // A sheet of pure white in the middle of a dark page is the single
    // brightest thing on screen, in the part people look at longest.
    expect(day.paper).toBe('#ffffff');
    expect(night.paper).not.toBe('#ffffff');
  });

  it('turns the drawing white on black rather than leaving it black on black', () => {
    expect(day.ink).toBe('#1f2937');
    expect(night.ink).toBe('#e2e8f0');
  });

  it('keeps the grid quieter than the ink in both', () => {
    // The grid is a guide, not part of the drawing; if it competes with the
    // walls the plan stops reading as a plan.
    expect(day.grid).not.toBe(day.ink);
    expect(night.grid).not.toBe(night.ink);
  });

  it('gives the floor of a room a wash that lets the paper through', () => {
    expect(day.roomFill.length).toBeGreaterThan(7);
    expect(night.roomFill.length).toBeGreaterThan(7);
  });

  it('puts the canvas darker than the panel it sits in at night', () => {
    // The cards around it are #1f2937; a canvas lighter than them would read
    // as another panel rather than as the surface being drawn on.
    const brightness = (hex: string) =>
      parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);

    expect(brightness(night.paper)).toBeLessThan(brightness('#1f2937'));
  });
});

describe('a colour chosen for white paper, put on dark paper', () => {
  const night = canvasColours(true);
  const day = canvasColours(false);

  it('keeps its hue and loses its brightness', () => {
    // The pastels the furniture is drawn in are light by construction; at full
    // strength on dark paper they would be the brightest things in the room.
    expect(tint('#dbeafe', night)).toBe('#dbeafe2e');
    expect(tint('#dbeafe', day)).toBe('#dbeafe');
  });

  it('turns an outline into ink, whatever colour it was', () => {
    // A mid-brown line on dark paper does not hold its contrast, and the
    // colour it loses was never carrying the meaning — the fill it encloses is.
    expect(strokeInk('#92400e', night)).toBe(night.ink);
    expect(strokeInk('#92400e', day)).toBe('#92400e');
  });

  it('leaves outlines alone in daylight, so the drawing is unchanged', () => {
    ['#111827', '#166534', '#60a5fa'].forEach((hex) => {
      expect(strokeInk(hex, day)).toBe(hex);
      expect(tint(hex, day)).toBe(hex);
    });
  });
});
