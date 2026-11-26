// Components call useTranslation, so i18next has to be initialised before any
// test renders one. Without this a page renders raw keys instead of copy.
import { configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import i18n from '../i18n';

// Tests assert against English, the reference locale, so they stay stable when
// the product's default language changes.
void i18n.changeLanguage('en');

// How long findBy… and waitFor wait for something to appear: 5 seconds, not
// Testing Library's 1. A dialog that opens in a tenth of a second alone took
// over a second with the full suite's workers sharing a busy laptop, and a
// different test failed on each run, which said nothing about the code. A
// genuinely missing element still fails, only later. The test's own limit is
// testTimeout in vite.config.ts.
configure({ asyncUtilTimeout: 5000 });

// jsdom has no matchMedia, which ThemeContext calls to resolve the 'system'
// theme. Reporting "no match" makes tests run in light mode consistently.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// jsdom has no ResizeObserver, and Recharts' ResponsiveContainer constructs one
// on mount. The stub never reports a size, which is correct here: layout is not
// what chart tests assert — the table view is.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// The access token lives in the API module's memory, which localStorage.clear()
// does not reach, so one test's sign-in would carry into the next. Imported at
// the call to reach the instance the test used, even after vi.resetModules().
afterEach(async () => {
  try {
    (await import('../services/api')).setAccessToken(null);
  } catch {
    // The test replaced the module with a mock that has no token to clear;
    // Vitest's mock throws on reading an export it does not define.
  }
});
