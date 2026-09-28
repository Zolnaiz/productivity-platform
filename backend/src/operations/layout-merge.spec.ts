import { mergeFloorFacts } from './layout-merge';

const opened = new Date('2026-09-28T02:00:00.000Z');

const zone = (over: Record<string, unknown> = {}) => ({ id: 'z1', code: 'A01', name: 'Reception', ...over });

/**
 * The editor saves the whole plan; the floor writes parts of it through routes
 * of its own. A plan saved as it stood when the editor opened it must not
 * write the floor's work back to what it was.
 */
describe('saving a plan the floor has written to meanwhile', () => {
  it('keeps a red tag raised from a phone after the editor read the plan', () => {
    const stored = [
      zone({
        redTags: [
          { id: 't-old', title: 'Box', status: 'open', createdAt: '2026-09-27T00:00:00.000Z' },
          { id: 't-phone', title: 'Spare chair', status: 'open', createdAt: '2026-09-28T02:05:00.000Z' },
        ],
      }),
    ];
    const sent = [zone({ name: 'Front desk', redTags: [{ id: 't-old', title: 'Box', status: 'open' }] })];

    const [merged] = mergeFloorFacts(stored, sent, opened);

    expect(merged.name).toBe('Front desk');
    expect(merged.redTags.map((tag: { id: string }) => tag.id)).toEqual(['t-old', 't-phone']);
    expect(merged.redTagCount).toBe(2);
  });

  it('lets the editor remove a tag it had seen', () => {
    const stored = [zone({ redTags: [{ id: 't-old', status: 'open', createdAt: '2026-09-27T00:00:00.000Z' }] })];

    const [merged] = mergeFloorFacts(stored, [zone({ redTags: [] })], opened);

    expect(merged.redTags).toEqual([]);
    expect(merged.redTagCount).toBe(0);
  });

  it('keeps a tag closed when its cleanup task was finished', () => {
    const stored = [zone({ redTags: [{ id: 't1', status: 'open', closedAt: '2026-09-28T03:00:00.000Z' }] })];

    const [merged] = mergeFloorFacts(stored, [zone({ redTags: [{ id: 't1', status: 'open', title: 'Renamed' }] })], opened);

    expect(merged.redTags[0]).toMatchObject({ title: 'Renamed', closedAt: '2026-09-28T03:00:00.000Z' });
    expect(merged.redTagCount).toBe(0);
  });

  it('keeps the later cleaning and the later audit, score with its date', () => {
    const stored = [
      zone({
        lastCleanedAt: '2026-09-28',
        lastAuditAt: '2026-09-28T01:00:00.000Z',
        lastAuditScore: 80,
        tierAudits: { '1': { lastAuditAt: '2026-09-28T01:00:00.000Z', lastAuditScore: 80 } },
      }),
    ];
    const sent = [
      zone({
        lastCleanedAt: '2026-09-20',
        lastAuditAt: '2026-09-21T01:00:00.000Z',
        lastAuditScore: 60,
        tierAudits: { '1': { lastAuditAt: '2026-09-21T01:00:00.000Z', lastAuditScore: 60 } },
      }),
    ];

    const [merged] = mergeFloorFacts(stored, sent, opened);

    expect(merged).toMatchObject({ lastCleanedAt: '2026-09-28', lastAuditAt: '2026-09-28T01:00:00.000Z', lastAuditScore: 80 });
    expect(merged.tierAudits['1'].lastAuditScore).toBe(80);
  });

  it('drops a zone the editor deleted, and takes a new one as it is', () => {
    const merged = mergeFloorFacts([zone()], [zone({ id: 'z2', name: 'New' })], opened);

    expect(merged.map((item) => item.id)).toEqual(['z2']);
  });

  it('without knowing when the editor read the plan, keeps only what the editor sent', () => {
    const stored = [zone({ redTags: [{ id: 't-phone', status: 'open', createdAt: '2026-09-28T02:05:00.000Z' }] })];

    const [merged] = mergeFloorFacts(stored, [zone({ redTags: [] })]);

    expect(merged.redTags).toEqual([]);
  });
});
