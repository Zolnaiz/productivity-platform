/**
 * What a request asked to change, written so it can be kept.
 *
 * The trail records that somebody updated a zone; it has never recorded what
 * they updated, which is the first thing anybody reading it asks. The reason
 * was a good one: the obvious way to record the change is to keep the request
 * body, and request bodies contain passwords, tokens, and a floor plan's
 * background image as a megabyte of base64.
 *
 * So the body is summarised rather than stored. Three rules, in this order:
 *
 *   1. A field whose name says it is a secret keeps its name and loses its
 *      value. "They changed the password" is exactly what a reader needs;
 *      which password is what must never be written down.
 *   2. A value too large to read is replaced by what it is and how big. A
 *      drawing's worth of base64 in an audit table is a table nobody can
 *      query and a row nobody can read.
 *   3. Everything else is kept as it was sent, because the point is to be able
 *      to say what the change was.
 *
 * What this cannot do is say what the value was *before*: an interceptor sees
 * the request and the response, not the row as it stood. So these are the
 * changes that were asked for, which the entry's own wording has to reflect.
 */

/** Field names whose values never leave the request. */
const SECRET_FIELDS = [
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'apikey',
  'authorization',
  'otp',
  'pin',
];

/** Longer than this and a value is described rather than kept. */
export const MAX_VALUE_LENGTH = 120;

/** More than this many fields and the rest are counted rather than listed. */
export const MAX_FIELDS = 40;

export const isSecretField = (field: string) => {
  const name = field.toLowerCase();

  return SECRET_FIELDS.some((secret) => name === secret || name.endsWith(secret));
};

const describeString = (value: string) => {
  if (value.startsWith('data:')) {
    const kind = value.slice(5, value.indexOf(';') > 0 ? value.indexOf(';') : 20) || 'file';

    return `[${kind}, ${Math.round(value.length / 1024)} KB]`;
  }

  return `${value.slice(0, MAX_VALUE_LENGTH)}… [${value.length} chars]`;
};

/**
 * One value, small enough and safe enough to keep.
 *
 * Arrays and objects are described by their shape rather than kept: a zone
 * list is the plan, and copying the plan into the trail on every save would
 * make the trail larger than the thing it describes.
 */
export const summariseValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value ?? null;

  if (typeof value === 'string') {
    return value.length > MAX_VALUE_LENGTH ? describeString(value) : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') return value;

  if (Array.isArray(value)) return `[${value.length} item(s)]`;

  if (typeof value === 'object') return `{${Object.keys(value as object).length} field(s)}`;

  return String(value);
};

export interface ChangeSummary {
  /** Every field the request asked to change, in order, including secrets. */
  fields: string[];
  /** What it asked to change them to, secrets redacted and large values described. */
  values: Record<string, unknown>;
  /** Fields beyond the limit, counted rather than listed. */
  more?: number;
}

/**
 * Summarises a request body, or returns null when there is nothing to say.
 *
 * A delete carries no body and a body that is not an object — a raw string, an
 * array of ids — has no fields to name; both are recorded as a change with no
 * detail rather than as a shape the reader has to interpret.
 */
export const summariseChange = (body: unknown): ChangeSummary | null => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const entries = Object.entries(body as Record<string, unknown>);
  if (!entries.length) return null;

  const kept = entries.slice(0, MAX_FIELDS);
  const values: Record<string, unknown> = {};

  kept.forEach(([field, value]) => {
    values[field] = isSecretField(field) ? '[redacted]' : summariseValue(value);
  });

  const summary: ChangeSummary = { fields: kept.map(([field]) => field), values };
  if (entries.length > kept.length) summary.more = entries.length - kept.length;

  return summary;
};
