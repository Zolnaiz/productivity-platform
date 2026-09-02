// Components call useTranslation, so i18next has to be initialised before any
// test renders one. Without this a page renders raw keys instead of copy.
import i18n from '../i18n';

// Tests assert against English, the reference locale, so they stay stable when
// the product's default language changes.
void i18n.changeLanguage('en');

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
