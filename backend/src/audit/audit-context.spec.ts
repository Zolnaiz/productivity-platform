import { auditBefore, noteAuditBefore, withAuditContext } from './audit-context';

/**
 * The half of the trail that was missing.
 *
 * "Somebody set the audit frequency to monthly" is half an answer; what a
 * reader is actually asking is what it was before they did. An interceptor
 * cannot know — it sees the request and the response, never the row — so the
 * service that loads the record hands over what it is about to overwrite.
 */
describe('what a record held before a request changed it', () => {
  it('keeps only the fields the change touches', () => {
    // A snapshot of the whole record would bury the one value that changed,
    // and the summary's own field limit would then drop it.
    withAuditContext(() => {
      noteAuditBefore(
        { id: 'z1', auditFrequency: 'weekly', name: 'Storage', standard: 'A long standard' },
        ['auditFrequency'],
      );

      expect(auditBefore()).toEqual({ fields: ['auditFrequency'], values: { auditFrequency: 'weekly' } });
    });
  });

  it('says nothing when none of the fields existed before', () => {
    // Setting a field that was never there is a creation of that field, and
    // an empty "before" would read as if it had held nothing in particular.
    withAuditContext(() => {
      noteAuditBefore({ id: 'z1' }, ['ownerName']);

      expect(auditBefore()).toBeUndefined();
    });
  });

  it('redacts a secret by the same rule the change goes through', () => {
    withAuditContext(() => {
      noteAuditBefore({ password: 'the-old-one', email: 'sara@plant.local' }, ['password', 'email']);

      expect(auditBefore()?.values).toEqual({
        password: '[redacted]',
        email: 'sara@plant.local',
      });
    });
  });

  it('keeps the first note, so a cascade cannot overwrite the answer', () => {
    // Finishing a task closes the red tag it came from. One request is one
    // entry, and the entry is about the task.
    withAuditContext(() => {
      noteAuditBefore({ status: 'todo' }, ['status']);
      noteAuditBefore({ closedAt: null }, ['closedAt']);

      expect(auditBefore()?.fields).toEqual(['status']);
    });
  });

  it('does nothing at all outside a request', () => {
    // The scheduler and the seed run without one, and neither should fail or
    // leak a value into the next request that has one.
    expect(() => noteAuditBefore({ status: 'todo' }, ['status'])).not.toThrow();
    expect(auditBefore()).toBeUndefined();
  });

  it("keeps one request's values out of another's", async () => {
    const first = withAuditContext(async () => {
      noteAuditBefore({ status: 'todo' }, ['status']);
      await Promise.resolve();

      return auditBefore();
    });

    const second = withAuditContext(async () => {
      await Promise.resolve();

      return auditBefore();
    });

    expect((await first)?.values).toEqual({ status: 'todo' });
    expect(await second).toBeUndefined();
  });
});
