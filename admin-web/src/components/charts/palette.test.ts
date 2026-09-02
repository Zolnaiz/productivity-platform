import { describe, expect, it } from 'vitest';
import { auditBandFor, auditBands, chartTheme, ordinalRamp, seriesHue } from './palette';

// Relative luminance per WCAG, used to assert the ramp really reads light→dark
// and that marks stay visible against the surface they render on.
const luminance = (hex: string) => {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  const int = parseInt(hex.slice(1), 16);
  const r = channel((int >> 16) & 255);
  const g = channel((int >> 8) & 255);
  const b = channel(int & 255);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

describe('chart palette', () => {
  it('serves the light values in light mode and the dark values in dark mode', () => {
    expect(chartTheme(false).series).toBe(seriesHue.light);
    expect(chartTheme(true).series).toBe(seriesHue.dark);
    expect(chartTheme(false).ordinal).toEqual(ordinalRamp.light);
    expect(chartTheme(true).ordinal).toEqual(ordinalRamp.dark);
  });

  it('steps the ordinal ramp monotonically from light to dark in both modes', () => {
    (['light', 'dark'] as const).forEach((mode) => {
      const steps = ordinalRamp[mode].map(luminance);

      steps.slice(1).forEach((step, index) => {
        expect(step, `${mode} step ${index + 1} should be darker than the one before`).toBeLessThan(steps[index]);
      });
    });
  });

  it('keeps the ramp step nearest each surface above the 2:1 visibility floor', () => {
    // The step that risks disappearing is the lightest one on white and the
    // darkest one on the dark card.
    expect(contrast(ordinalRamp.light[0], chartTheme(false).surface)).toBeGreaterThanOrEqual(2);
    expect(contrast(ordinalRamp.dark[ordinalRamp.dark.length - 1], chartTheme(true).surface)).toBeGreaterThanOrEqual(2);
  });

  it('keeps the single series hue at 3:1 against its surface', () => {
    expect(contrast(seriesHue.light, chartTheme(false).surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(seriesHue.dark, chartTheme(true).surface)).toBeGreaterThanOrEqual(3);
  });

  it('never paints label text in a series colour', () => {
    (['light', 'dark'] as const).forEach((mode) => {
      const theme = chartTheme(mode === 'dark');
      const inkValues = [theme.ink.primary, theme.ink.secondary, theme.ink.muted];

      expect(inkValues).not.toContain(theme.series);
      theme.ordinal.forEach((step) => expect(inkValues).not.toContain(step));
    });
  });
});

describe('audit condition bands', () => {
  it('places a score in the band a 5S practitioner would read it in', () => {
    expect(auditBandFor(100)).toBe('good');
    expect(auditBandFor(85)).toBe('good');
    expect(auditBandFor(84)).toBe('watch');
    expect(auditBandFor(70)).toBe('watch');
    expect(auditBandFor(69)).toBe('poor');
    expect(auditBandFor(0)).toBe('poor');
  });

  it('treats a zone with no audit as unknown, not as failing', () => {
    // Absence of a score is absence of data. Painting it red would invent a
    // finding nobody made.
    expect(auditBandFor(undefined)).toBe('none');
    expect(auditBandFor(Number.NaN)).toBe('none');
  });

  it('keeps a real zero as a score rather than as missing data', () => {
    expect(auditBandFor(0)).not.toBe('none');
  });

  it('gives every band a distinct colour', () => {
    const values = Object.values(auditBands);
    expect(new Set(values).size).toBe(values.length);
  });
});
