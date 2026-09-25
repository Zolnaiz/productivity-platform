import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import en from './locales/en';

/**
 * The API names failures with `errorCode`; this app supplies the wording. That
 * only works while both sides agree on the list, and nothing in the type system
 * spans the two workspaces — so the agreement is checked here instead.
 *
 * A backend code with no `errors.<CODE>` key would reach a user as the generic
 * "Something went wrong", losing the specific advice the code was added for.
 */
const backendErrorCodes = (): string[] => {
  const here = dirname(fileURLToPath(import.meta.url));
  const source = readFileSync(
    resolve(here, '../../../backend/src/shared/errors/api-error.ts'),
    'utf-8',
  );

  const declaration = source.match(/export const ErrorCode = \{([\s\S]*?)\} as const;/);
  expect(declaration, 'ErrorCode declaration not found in the backend').not.toBeNull();

  return [...declaration![1].matchAll(/:\s*'([A-Z_]+)'/g)].map((match) => match[1]);
};

describe('API error contract', () => {
  const codes = backendErrorCodes();

  it('finds the codes the backend declares', () => {
    expect(codes.length).toBeGreaterThan(5);
    expect(codes).toContain('AUTH_INVALID_CREDENTIALS');
  });

  it('has a translation for every code the backend can send', () => {
    const translated = Object.keys(en.errors);
    const missing = codes.filter((code) => !translated.includes(code));

    expect(missing, `Backend codes with no wording in en.ts: ${missing.join(', ')}`).toEqual([]);
  });

  it('has no wording for a code the backend cannot send', () => {
    // `offline` and `unknown` are the client's own: no server produces them.
    const clientOnly = ['offline', 'unknown'];
    const orphaned = Object.keys(en.errors).filter(
      (key) => !clientOnly.includes(key) && !codes.includes(key),
    );

    expect(orphaned, `Wording for codes the backend no longer sends: ${orphaned.join(', ')}`).toEqual([]);
  });
});
