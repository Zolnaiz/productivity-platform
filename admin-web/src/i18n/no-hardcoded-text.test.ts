import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * No sentence in one language written straight into a screen.
 *
 * Text fixed in the source reads in that language whatever the reader chose,
 * and this application has shipped exactly that more than once: Mongolian
 * empty states on an English page, English messages on a Mongolian one. The
 * locale files are where words live. Comments are fine; so are the few places
 * that are meant to read the same in both, listed below with their reason.
 */
const root = join(__dirname, '..');

const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'locales' ? [] : sources(path);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });

const allowed: Record<string, string> = {
  // Each language names itself, so the switch is readable whichever is active.
  'components/layout/LanguageToggle.tsx': 'language names',
  'pages/SettingsPage.tsx': 'language names',
};

const isComment = (line: string) => /^\s*(\/\/|\*|\/\*|\{\/\*)/.test(line);

describe('text in the screens', () => {
  it('has no Mongolian written straight into the source', () => {
    const offenders = sources(root)
      .map((path) => relative(root, path).replace(/\\/g, '/'))
      .filter((path) => !allowed[path])
      .flatMap((path) =>
        readFileSync(join(root, path), 'utf-8')
          .split('\n')
          .map((line, index) => ({ line, index }))
          .filter(({ line }) => !isComment(line) && /[а-яА-ЯөүӨҮ]{3,}/.test(line))
          .map(({ index }) => `${path}:${index + 1}`),
      );

    expect({ writtenInTheSource: offenders }).toEqual({ writtenInTheSource: [] });
  });

  /*
    English is harder to tell from code than Cyrillic, so this looks where a
    screen's words go: text standing between tags, on its own line after one
    or inline as `>Due {date}<`. The 5S editor had two dozen such labels -
    "Owner", "Disposition", "No areas match the current filters." - that read
    in English on a Mongolian page and that the test above could not see.
  */
  it('has no English written straight into a screen’s markup', () => {
    // The product's name reads the same in both languages.
    const names = new Set(['Productivity Platform']);

    const offenders = sources(root)
      .filter((path) => path.endsWith('.tsx'))
      .flatMap((path) => {
        const lines = readFileSync(path, 'utf-8').split(/\r?\n/);
        const found: string[] = [];
        let inComment = false;

        lines.forEach((line, index) => {
          const text = line.trim();
          if (inComment) {
            if (text.includes('*/')) inComment = false;
            return;
          }
          if (text.startsWith('{/*') || text.startsWith('/*')) {
            inComment = !text.includes('*/');
            return;
          }
          if (isComment(line)) return;

          const before = lines.slice(0, index).reverse().find((previous) => previous.trim()) ?? '';
          // A value in the sentence - `Showing {n} of {total} areas` - is
          // read as a number, so the words around it are still seen.
          const bare = text.replace(/\{[^{}]*\}/g, '0');
          const standsAlone =
            before.trim().endsWith('>') &&
            !/[;=]/.test(text) &&
            (/^[A-Z][A-Za-z0-9 ,'’().:%&!?/-]*[a-z][A-Za-z0-9 ,'’().:%&!?/-]*$/.test(text) ||
              (bare !== text && /^[A-Za-z0-9 ,’.:%!?-]+$/.test(bare) && /[a-z]{2,} [a-z]{2,}/.test(bare)));
          const inline =
            />([A-Z][a-z]+(?: [a-zA-Z]+)+[.!?]?)</.exec(line)?.[1] ??
            (/>[A-Z][a-z]+ \{/.test(line) ? text : '') ||
            (/\}%? ([a-z]{2,}(?: [a-z]{2,})+)[.!?]?</.exec(line)?.[1] ?? '');
          const words = standsAlone ? text : inline;

          if (words && !names.has(words)) found.push(`${relative(root, path).replace(/\\/g, '/')}:${index + 1}`);
        });

        return found;
      });

    expect({ writtenInTheMarkup: offenders }).toEqual({ writtenInTheMarkup: [] });
  });

  // A heading handed to a component is on the screen as much as text between
  // tags: `title={`Needs attention (${count})`}` read in English on the
  // Mongolian notifications page until this looked there too.
  it('has no English handed to a component as its words', () => {
    const attribute =
      /\b(title|label|placeholder|aria-label|description|subtitle|emptyText|message)=\{?[`"']([A-Z][a-z]+(?: [a-zA-Z]+)+)/;
    const offenders = sources(root)
      .filter((path) => path.endsWith('.tsx'))
      .flatMap((path) =>
        readFileSync(path, 'utf-8')
          .split(/\r?\n/)
          .map((line, index) => ({ line, index }))
          .filter(({ line }) => !isComment(line) && attribute.test(line))
          .map(({ index }) => `${relative(root, path).replace(/\\/g, '/')}:${index + 1}`),
      );

    expect({ handedToAComponent: offenders }).toEqual({ handedToAComponent: [] });
  });
});
