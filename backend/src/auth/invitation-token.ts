import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Invitation tokens.
 *
 * A token grants membership of an organization, so it is treated like a
 * credential: generated from a cryptographic source, stored only as a hash,
 * and compared without leaking its length or contents through timing.
 */

/** 32 bytes of randomness, url-safe. Guessing one is not a realistic attack. */
export const createInvitationToken = () => randomBytes(32).toString('base64url');

export const hashInvitationToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

/** How long an invitation stays valid. Long enough to be seen, short enough to expire. */
export const INVITATION_TTL_DAYS = 14;

export const invitationExpiry = (from = new Date()) =>
  new Date(from.getTime() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);

/**
 * Constant-time comparison of two hex hashes.
 *
 * The lookup is by hash so this is belt and braces, but a token check that
 * returns early on the first differing byte is the kind of detail worth not
 * getting wrong.
 */
export const hashesMatch = (a: string, b: string) => {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');

  if (left.length !== right.length || left.length === 0) {
    return false;
  }

  return timingSafeEqual(left, right);
};

/** Addresses are compared case-insensitively and stored trimmed and lowered. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
