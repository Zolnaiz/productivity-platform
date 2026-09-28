/**
 * Keeping what the floor wrote while the plan was open in the editor.
 *
 * The editor saves a whole plan: every zone, with everything in it. But some
 * of a zone is written from the floor, through routes of its own - a red tag
 * raised from a phone, "cleaned today", an audit's score, a tag closed when
 * its cleanup task was finished. Saved as it stood when the editor opened
 * it, the plan wrote all of that back to what it was: the phone's tag
 * vanished, the area read as uncleaned, the score went back a week.
 *
 * So those facts are merged rather than replaced. Dates keep the later of the
 * two; a closed tag stays closed; and a tag the editor has never seen - one
 * raised after `base`, when the editor read the plan - is kept. A tag the
 * editor did see and no longer sends was removed there, and stays removed.
 */
type Zone = Record<string, any>;
type RedTag = Record<string, any>;

const later = (a?: string, b?: string) => {
  if (!a) return b;
  if (!b) return a;
  return new Date(b).getTime() > new Date(a).getTime() ? b : a;
};

const isOpen = (redTag: RedTag) => !redTag.closedAt && ['open', 'review'].includes(String(redTag.status));

const mergeRedTags = (stored: RedTag[], sent: RedTag[], base?: Date): RedTag[] => {
  const storedById = new Map(stored.map((redTag) => [redTag.id, redTag]));
  const sentIds = new Set(sent.map((redTag) => redTag.id));

  const kept = sent.map((redTag) => {
    const before = storedById.get(redTag.id);
    // Closed on the floor while the editor still showed it open.
    return before?.closedAt && !redTag.closedAt ? { ...redTag, closedAt: before.closedAt } : redTag;
  });

  const raisedSince = base
    ? stored.filter(
        (redTag) =>
          !sentIds.has(redTag.id) && redTag.createdAt && new Date(redTag.createdAt).getTime() > base.getTime(),
      )
    : [];

  return [...kept, ...raisedSince];
};

const mergeTierAudits = (stored?: Record<string, any>, sent?: Record<string, any>) => {
  if (!stored) return sent;
  const merged: Record<string, any> = { ...(sent ?? {}) };

  for (const [tier, audit] of Object.entries(stored)) {
    const mine = merged[tier];
    merged[tier] = !mine || later(mine.lastAuditAt, audit?.lastAuditAt) !== mine.lastAuditAt ? audit : mine;
  }

  return merged;
};

export const mergeFloorFacts = (stored: Zone[], sent: Zone[], base?: Date): Zone[] => {
  const storedById = new Map((stored ?? []).map((zone) => [zone.id, zone]));

  return (sent ?? []).map((zone) => {
    const before = storedById.get(zone.id);
    if (!before) return zone;

    const merged: Zone = { ...zone };

    merged.lastCleanedAt = later(zone.lastCleanedAt, before.lastCleanedAt);

    // A score and its date go together: the later audit's pair.
    if (later(zone.lastAuditAt, before.lastAuditAt) !== zone.lastAuditAt) {
      merged.lastAuditAt = before.lastAuditAt;
      merged.lastAuditScore = before.lastAuditScore;
    }

    // The first score an area ever had is the server's to keep.
    if (before.baselineAt) {
      merged.baselineScore = before.baselineScore;
      merged.baselineAt = before.baselineAt;
    }

    const tierAudits = mergeTierAudits(before.tierAudits, zone.tierAudits);
    if (tierAudits) merged.tierAudits = tierAudits;

    if (Array.isArray(before.redTags) || Array.isArray(zone.redTags)) {
      merged.redTags = mergeRedTags(before.redTags ?? [], zone.redTags ?? [], base);
      merged.redTagCount = merged.redTags.filter(isOpen).length;
    }

    return merged;
  });
};
