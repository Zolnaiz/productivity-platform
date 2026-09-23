import { AsyncLocalStorage } from 'node:async_hooks';
import { ChangeSummary, summariseChange } from './change-summary';

/**
 * What a record looked like before the request changed it.
 *
 * The trail records what a request *asked* to change, and has never been able
 * to say what the value was before, because an interceptor sees the request
 * and the response and never the row as it stood. "Somebody set the audit
 * frequency to monthly" is half an answer; the question a reader is actually
 * asking is what it was before they did.
 *
 * Reading the row for every request would be a second query on every write,
 * most of them pointless. So the services that already load the record before
 * writing it — which is every update in this application, since they all
 * fetch, assign and save — hand over what they are about to overwrite, and the
 * interceptor picks it up.
 *
 * An async-local store rather than a parameter threaded through every method:
 * the service layer knows nothing about requests, and it should not have to
 * start knowing in order for the trail to be complete.
 */
const storage = new AsyncLocalStorage<{ before?: ChangeSummary }>();

/** Runs a request with somewhere for its "before" to be put. */
export const withAuditContext = <T>(run: () => T): T => storage.run({}, run);

/**
 * Notes what these fields held before they are overwritten.
 *
 * Only the fields the change touches: a snapshot of the whole record would
 * bury the one value that changed, and the summary's own limits would then
 * drop it. Secrets and oversized values are handled by the same rules the
 * asked-for change goes through, so a password cannot reach the table by this
 * door either.
 *
 * The first call wins. One request is one entry, and a save that cascades into
 * another record — closing a red tag because its task was finished — must not
 * overwrite what the reader asked about.
 */
export const noteAuditBefore = (record: unknown, fields: string[]) => {
  const store = storage.getStore();

  if (!store || store.before || !record || typeof record !== 'object') return;

  const source = record as Record<string, unknown>;
  const touched = fields.filter((field) => field in source);

  if (!touched.length) return;

  const previous = Object.fromEntries(touched.map((field) => [field, source[field]]));
  const summary = summariseChange(previous);

  if (summary) {
    store.before = summary;
  }
};

/** What was noted, for the entry being written. */
export const auditBefore = () => storage.getStore()?.before;
