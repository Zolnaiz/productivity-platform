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
});
