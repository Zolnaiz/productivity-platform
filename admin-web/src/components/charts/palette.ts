/**
 * Chart palette.
 *
 * Every value below was checked with the data-viz validator against the two
 * surfaces charts actually render on — the card background, white in light mode
 * and #1f2937 in dark — not against a generic surface. Re-run the validator if
 * you change a hex or a card background.
 *
 *   single hue      light #2a78d6 / dark #3987e5 — all categorical checks pass
 *   ordinal ramp    5 steps, monotone lightness, adjacent ΔL ≥ 0.06, and the
 *                   step nearest the surface clears the 2:1 floor in both modes
 */

export const chartSurface = {
  light: '#ffffff',
  dark: '#1f2937',
} as const;

/** One measure, one colour. Bars that only compare magnitude use this. */
export const seriesHue = {
  light: '#2a78d6',
  dark: '#3987e5',
} as const;

/**
 * For categories that carry a real order — pipeline stages, tiers. Never use
 * this for nominal categories: it would encode bar length twice.
 */
export const ordinalRamp = {
  light: ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'],
  dark: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf'],
} as const;

/**
 * Condition bands for a 5S audit score, used to colour zones on the area map.
 *
 * A score is not a magnitude to be ramped — practitioners read it in bands, so
 * this is a status scale, not a sequential one. Validated as a categorical set
 * against the map surface, which is white in both themes:
 *
 *   CVD separation   worst adjacent pair ΔE 19.9 (protan), 30.4 (tritan)
 *   normal vision    worst adjacent pair ΔE 29.1
 *
 * Never the only signal: the zone prints its score as text beside the colour,
 * and `auditBandLabel` names the band for anyone who cannot use either.
 */
export const auditBands = {
  /** At or above the 5S pass mark. */
  good: '#0d7f56',
  /** Below the pass mark — corrective work is already raised. */
  watch: '#e0a800',
  /** Well below. Needs attention this week, not next. */
  poor: '#9e1f1a',
  /** Never audited. Absence of data, not a bad result — so no band colour. */
  none: '#8a8d91',
} as const;

export const AUDIT_PASSING_SCORE = 85;
export const AUDIT_URGENT_SCORE = 70;

export type AuditBand = keyof typeof auditBands;

export const auditBandFor = (score?: number): AuditBand => {
  if (score === undefined || score === null || Number.isNaN(score)) return 'none';
  if (score >= AUDIT_PASSING_SCORE) return 'good';
  if (score >= AUDIT_URGENT_SCORE) return 'watch';
  return 'poor';
};

/** Chrome and ink. Labels never wear a series colour. */
export const chartInk = {
  light: {
    grid: '#e1e0d9',
    axis: '#c3c2b7',
    muted: '#898781',
    /** Direct value labels carry data, so they sit a step above axis ticks. */
    secondary: '#52514e',
    primary: '#0b0b0b',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e5e7eb',
  },
  dark: {
    grid: '#374151',
    axis: '#4b5563',
    muted: '#9ca3af',
    secondary: '#c3c2b7',
    primary: '#f9fafb',
    tooltipBg: '#111827',
    tooltipBorder: '#374151',
  },
} as const;

export type ChartMode = 'light' | 'dark';

export const chartTheme = (isDark: boolean) => {
  const mode: ChartMode = isDark ? 'dark' : 'light';

  return {
    mode,
    surface: chartSurface[mode],
    series: seriesHue[mode],
    ordinal: ordinalRamp[mode],
    ink: chartInk[mode],
  };
};
