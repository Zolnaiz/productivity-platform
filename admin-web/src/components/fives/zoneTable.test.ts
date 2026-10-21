import { describe, expect, it } from 'vitest';
import type { FiveSZone } from '../../types/fiveS.types';
import { newZone, nextCode, zoneProblems } from './zoneTable';

const zone = (over: Partial<FiveSZone>): FiveSZone => ({
  ...newZone([], 'Area', over.id ?? 'z'),
  ...over,
});

describe('the 5S area table rules', () => {
  it.each([
    ['a clean table', [zone({ id: 'a', code: 'A01' }), zone({ id: 'b', code: 'A02' })], {}],
    ['a missing name', [zone({ id: 'a', code: 'A01', name: '  ' })], { a: ['nameRequired'] }],
    ['a missing code', [zone({ id: 'a', code: '' })], { a: ['codeRequired'] }],
    [
      'the same code twice, in any case',
      [zone({ id: 'a', code: 'A01' }), zone({ id: 'b', code: 'a01 ' })],
      { a: ['codeDuplicate'], b: ['codeDuplicate'] },
    ],
    ['a negative area', [zone({ id: 'a', code: 'A01', areaSquareMetres: -1 })], { a: ['areaInvalid'] }],
    ['an area of zero, which is allowed', [zone({ id: 'a', code: 'A01', areaSquareMetres: 0 })], {}],
  ])('%s', (_name, zones, expected) => {
    expect(zoneProblems(zones)).toEqual(expected);
  });

  it('numbers new areas after the highest code in use', () => {
    expect(nextCode([])).toBe('A01');
    expect(nextCode([zone({ code: 'A07' }), zone({ code: 'B02' })])).toBe('A08');
  });

  it('places a new area below everything already drawn, so the editor does not overlap it', () => {
    const existing = [zone({ id: 'a', code: 'A01', y: 300, height: 100 })];
    const added = newZone(existing, 'Store', 'new');
    expect(added).toMatchObject({ id: 'new', code: 'A02', name: 'Store', stage: 'sort' });
    expect(added.y).toBeGreaterThanOrEqual(400);
  });
});
