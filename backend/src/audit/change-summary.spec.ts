import { MAX_FIELDS, MAX_VALUE_LENGTH, isSecretField, summariseChange, summariseValue } from './change-summary';

describe('what a request asked to change', () => {
  it('names the fields and keeps what they were set to', () => {
    // The first thing anybody reading a trail asks is what was changed.
    const summary = summariseChange({ name: 'Goods in', priority: 'high' });

    expect(summary).toEqual({
      fields: ['name', 'priority'],
      values: { name: 'Goods in', priority: 'high' },
    });
  });

  it('keeps a secret field’s name and loses its value', () => {
    // "They changed the password" is what a reader needs; which password is
    // what must never be written into a table people are meant to read.
    const summary = summariseChange({ email: 'bat@example.com', password: 'hunter2' });

    expect(summary?.fields).toEqual(['email', 'password']);
    expect(summary?.values.password).toBe('[redacted]');
    expect(summary?.values.email).toBe('bat@example.com');
  });

  it('recognises a secret however it is spelt', () => {
    ['password', 'currentPassword', 'newPassword', 'refreshToken', 'apiKey', 'otp'].forEach((field) =>
      expect(isSecretField(field)).toBe(true),
    );
  });

  it('does not mistake an ordinary field for a secret', () => {
    // `pinned` ends with no secret, and `tokenCount` is a number of things
    // rather than a credential.
    ['name', 'pinned', 'description', 'tokenCount'].forEach((field) =>
      expect(isSecretField(field)).toBe(false),
    );
  });

  it('describes a drawing rather than copying it into the trail', () => {
    // A floor plan's background arrives as a megabyte of base64. Copied into
    // the audit table it makes a row nobody can read and a table nobody can
    // query.
    const image = `data:image/png;base64,${'A'.repeat(60000)}`;
    const summary = summariseChange({ backgroundImage: image });

    expect(String(summary?.values.backgroundImage)).toMatch(/^\[image\/png, \d+ KB\]$/);
  });

  it('cuts a long string and says how long it was', () => {
    const summary = summariseChange({ standard: 'x'.repeat(500) });

    expect(String(summary?.values.standard)).toContain('[500 chars]');
    expect(String(summary?.values.standard).length).toBeLessThan(200);
  });

  it('keeps a short string exactly as it was sent', () => {
    const value = 'x'.repeat(MAX_VALUE_LENGTH);

    expect(summariseValue(value)).toBe(value);
  });

  it('describes a list by its size rather than its contents', () => {
    // The zones are the plan; copying them in on every save would make the
    // trail larger than the thing it describes.
    expect(summariseValue([1, 2, 3])).toBe('[3 item(s)]');
    expect(summariseValue({ a: 1, b: 2 })).toBe('{2 field(s)}');
  });

  it('keeps numbers, booleans and nulls as themselves', () => {
    expect(summariseValue(42)).toBe(42);
    expect(summariseValue(false)).toBe(false);
    expect(summariseValue(null)).toBeNull();
    expect(summariseValue(undefined)).toBeNull();
  });

  it('counts the fields beyond what is worth listing', () => {
    const body: Record<string, number> = {};
    for (let index = 0; index < MAX_FIELDS + 5; index += 1) body[`field${index}`] = index;

    const summary = summariseChange(body);

    expect(summary?.fields).toHaveLength(MAX_FIELDS);
    expect(summary?.more).toBe(5);
  });

  it('says nothing for a request that carries no body', () => {
    // A delete has nothing to summarise, and an entry with an empty change is
    // noise beside one that says what was changed.
    expect(summariseChange(undefined)).toBeNull();
    expect(summariseChange(null)).toBeNull();
    expect(summariseChange({})).toBeNull();
  });

  it('says nothing for a body that has no fields to name', () => {
    expect(summariseChange('a string')).toBeNull();
    expect(summariseChange(['a', 'list'])).toBeNull();
  });

  it('never returns a value larger than the cap, whatever it was given', () => {
    // The guarantee the table depends on: one entry cannot become unbounded.
    const body = {
      a: 'x'.repeat(100000),
      b: `data:image/png;base64,${'A'.repeat(100000)}`,
      c: new Array(1000).fill('x'),
    };

    Object.values(summariseChange(body)!.values).forEach((value) =>
      expect(String(value).length).toBeLessThan(MAX_VALUE_LENGTH + 60),
    );
  });
});
