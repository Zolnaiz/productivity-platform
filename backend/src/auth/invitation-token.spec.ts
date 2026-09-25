import {
  createInvitationToken,
  hashInvitationToken,
  hashesMatch,
  invitationExpiry,
  normalizeEmail,
} from './invitation-token';

describe('createInvitationToken', () => {
  it('never repeats a token', () => {
    const tokens = new Set(Array.from({ length: 500 }, () => createInvitationToken()));

    expect(tokens.size).toBe(500);
  });

  it('is long enough that guessing is not an attack', () => {
    // 32 random bytes. Anything materially shorter is worth questioning.
    expect(Buffer.from(createInvitationToken(), 'base64url')).toHaveLength(32);
  });

  it('is safe to put in a URL', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(createInvitationToken()).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });
});

describe('hashInvitationToken', () => {
  it('is stable for the same token', () => {
    const token = createInvitationToken();

    expect(hashInvitationToken(token)).toBe(hashInvitationToken(token));
  });

  it('differs for different tokens', () => {
    expect(hashInvitationToken('a')).not.toBe(hashInvitationToken('b'));
  });

  it('does not contain the token', () => {
    const token = createInvitationToken();

    expect(hashInvitationToken(token)).not.toContain(token);
  });
});

describe('hashesMatch', () => {
  it('matches a hash with itself', () => {
    const hash = hashInvitationToken('token');

    expect(hashesMatch(hash, hash)).toBe(true);
  });

  it('rejects a different hash', () => {
    expect(hashesMatch(hashInvitationToken('a'), hashInvitationToken('b'))).toBe(false);
  });

  it('rejects mismatched lengths without throwing', () => {
    // timingSafeEqual throws on differing lengths; the guard has to come first.
    expect(hashesMatch('abcd', hashInvitationToken('a'))).toBe(false);
    expect(hashesMatch('', '')).toBe(false);
  });
});

describe('invitationExpiry', () => {
  it('is two weeks out', () => {
    const from = new Date('2026-09-01T00:00:00.000Z');

    expect(invitationExpiry(from).toISOString()).toBe('2026-09-15T00:00:00.000Z');
  });
});

describe('normalizeEmail', () => {
  it('makes addresses comparable', () => {
    expect(normalizeEmail('  Owner@Example.COM ')).toBe('owner@example.com');
  });
});
