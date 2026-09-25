import { describe, expect, it } from 'vitest';
import { qrPath, zonePath, zoneUrl } from './zoneLink';

describe('where a zone label points', () => {
  it('names the plan and the zone', () => {
    // Not a token: a label is printed and stuck to a wall for a year, and
    // nothing on it should be able to expire.
    expect(zonePath('l1', 'zone-7')).toBe('/zone/l1/zone-7');
  });

  it('survives an id with something awkward in it', () => {
    expect(zonePath('plan 1', 'zone/7')).toBe('/zone/plan%201/zone%2F7');
  });

  it('makes a full address when the label has to carry one', () => {
    expect(zoneUrl('https://mpc.example.com', 'l1', 'z1')).toBe('https://mpc.example.com/zone/l1/z1');
  });

  it('does not double the slash when the origin already ends in one', () => {
    expect(zoneUrl('https://mpc.example.com/', 'l1', 'z1')).toBe('https://mpc.example.com/zone/l1/z1');
  });
});

describe('the square on the label', () => {
  it('is a square of modules with something drawn in it', () => {
    const code = qrPath('https://mpc.example.com/zone/l1/z1');

    expect(code.size).toBeGreaterThan(20);
    expect(code.path.length).toBeGreaterThan(100);
  });

  it('grows with what it has to carry', () => {
    const short = qrPath('https://a.co/zone/1/2');
    const long = qrPath(`https://mpc.example.com/zone/${'l'.repeat(60)}/${'z'.repeat(60)}`);

    expect(long.size).toBeGreaterThan(short.size);
  });

  it('draws every dark module as a unit square, so a sheet scales cleanly', () => {
    // Printed labels are the point; a path stays crisp at whatever size the
    // sheet puts it, and each module is one unit so the viewBox is the size.
    const code = qrPath('https://mpc.example.com/zone/l1/z1');

    expect(code.path).toMatch(/^M\d+ \d+h1v1h-1z/);
    expect(code.path.split('z').length - 1).toBeGreaterThan(50);
  });

  it('is one path rather than one element per module', () => {
    // Forty labels on a sheet should be forty elements, not forty thousand.
    const code = qrPath('https://mpc.example.com/zone/l1/z1');

    expect(typeof code.path).toBe('string');
  });

  it('reads back the same for the same text', () => {
    const text = 'https://mpc.example.com/zone/l1/z1';

    expect(qrPath(text)).toEqual(qrPath(text));
  });

  it('differs for a different zone, which is the whole point', () => {
    expect(qrPath('https://mpc.example.com/zone/l1/z1').path).not.toBe(
      qrPath('https://mpc.example.com/zone/l1/z2').path,
    );
  });
});
