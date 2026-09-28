import { numericColumn } from './numeric-column';

describe('a numeric column', () => {
  it('reads the text the driver sends as a number', () => {
    expect(numericColumn.from('40.00')).toBe(40);
    expect(numericColumn.from('2.50')).toBe(2.5);
  });

  it('leaves nothing as nothing', () => {
    expect(numericColumn.from(null)).toBeNull();
    expect(numericColumn.from(undefined)).toBeUndefined();
  });

  it('writes what it is given', () => {
    expect(numericColumn.to(12.5)).toBe(12.5);
  });
});
