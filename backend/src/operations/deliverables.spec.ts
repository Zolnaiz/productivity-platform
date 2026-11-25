/** Unit test for deliverables.ts: who may change, submit, approve and return a task's documents, and when. */
import {
  approveRefusal,
  fileChangeRefusal,
  numberVersions,
  returnRefusal,
  reviewerToTell,
  statusOf,
  submitRefusal,
} from './deliverables';

const author = { id: 'ana', canReview: false, canManageTasks: false };
const colleague = { id: 'bat', canReview: false, canManageTasks: false };
const manager = { id: 'mgr', canReview: true, canManageTasks: true };
const task = (reviewStatus: string | null = null) => ({ assigneeId: 'ana', reporterId: 'mgr', reviewStatus });

describe('statusOf', () => {
  it('reads anything unknown as no review yet', () => {
    expect(statusOf(task(null))).toBe('none');
    expect(statusOf(task('nonsense'))).toBe('none');
    expect(statusOf(task('returned'))).toBe('returned');
  });
});

describe('fileChangeRefusal', () => {
  it('lets the assignee and a manager add files before review and after a return', () => {
    expect(fileChangeRefusal(task(), author)).toBeNull();
    expect(fileChangeRefusal(task('returned'), author)).toBeNull();
    expect(fileChangeRefusal(task(), manager)).toBeNull();
  });

  it('refuses somebody else’s task to a colleague', () => {
    expect(fileChangeRefusal(task(), colleague)).toBe('not_yours');
  });

  it('freezes the files while under review and once approved, for everybody', () => {
    expect(fileChangeRefusal(task('submitted'), author)).toBe('locked');
    expect(fileChangeRefusal(task('approved'), manager)).toBe('locked');
  });
});

describe('submitRefusal', () => {
  it('sends files for review, first time or after a return', () => {
    expect(submitRefusal(task(), author, 1)).toBeNull();
    expect(submitRefusal(task('returned'), author, 2)).toBeNull();
  });

  it('needs at least one file, and cannot resubmit what is already under review or approved', () => {
    expect(submitRefusal(task(), author, 0)).toBe('no_files');
    expect(submitRefusal(task('submitted'), author, 1)).toBe('wrong_state');
    expect(submitRefusal(task('approved'), author, 1)).toBe('wrong_state');
  });
});

describe('approveRefusal and returnRefusal', () => {
  it('lets a reviewer approve or return what was submitted', () => {
    expect(approveRefusal(task('submitted'), manager)).toBeNull();
    expect(returnRefusal(task('submitted'), manager, 'Page 3 is missing')).toBeNull();
  });

  it('refuses anyone without the review permission', () => {
    expect(approveRefusal(task('submitted'), colleague)).toBe('not_yours');
  });

  it('only acts on submitted work', () => {
    expect(approveRefusal(task(), manager)).toBe('wrong_state');
    expect(approveRefusal(task('approved'), manager)).toBe('wrong_state');
  });

  it('does not let anybody approve their own work, managers included', () => {
    const ownTask = { assigneeId: 'mgr', reporterId: 'boss', reviewStatus: 'submitted' };
    expect(approveRefusal(ownTask, manager)).toBe('self_review');
  });

  it('needs a reason to return', () => {
    expect(returnRefusal(task('submitted'), manager, '')).toBe('note_required');
    expect(returnRefusal(task('submitted'), manager, ' no ')).toBe('note_required');
  });
});

describe('reviewerToTell', () => {
  it('tells whoever gave out the task, but never the author themselves', () => {
    expect(reviewerToTell(task('submitted'), 'ana')).toBe('mgr');
    expect(reviewerToTell({ assigneeId: 'ana', reporterId: 'ana' }, 'ana')).toBeNull();
    expect(reviewerToTell({ assigneeId: 'ana', reporterId: null }, 'ana')).toBeNull();
  });
});

describe('numberVersions', () => {
  it('numbers by upload order and lists newest first', () => {
    const files = [
      { id: 'b', createdAt: '2026-11-25T10:00:00Z' },
      { id: 'a', createdAt: '2026-11-24T10:00:00Z' },
      { id: 'c', createdAt: '2026-11-26T10:00:00Z' },
    ];
    expect(numberVersions(files).map((f) => [f.id, f.version])).toEqual([
      ['c', 3],
      ['b', 2],
      ['a', 1],
    ]);
  });
});
