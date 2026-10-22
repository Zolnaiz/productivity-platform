import { FeedbackService } from './feedback.service';
import { FeedbackKind } from './entities/feedback.entity';

describe('FeedbackService', () => {
  const build = () => {
    const rows: any[] = [];
    const repository = {
      create: jest.fn((value) => ({ id: `f${rows.length + 1}`, ...value })),
      save: jest.fn(async (value) => {
        if (!rows.includes(value)) rows.push(value);
        return value;
      }),
      find: jest.fn(async ({ where }) => rows.filter((row) => row.organizationId === where.organizationId)),
      findOne: jest.fn(
        async ({ where }) => rows.find((row) => row.id === where.id && row.organizationId === where.organizationId) ?? null,
      ),
    };
    return { service: new FeedbackService(repository as never), rows };
  };

  const member = { id: 'u1', organizationId: 'org-1' };

  it('stores feedback in the sender’s organization, trimmed', async () => {
    const { service, rows } = build();

    await service.create({ kind: FeedbackKind.BUG, message: '  The save button does nothing ', page: '/fives' }, member);

    expect(rows[0]).toMatchObject({
      organizationId: 'org-1',
      authorId: 'u1',
      kind: 'bug',
      message: 'The save button does nothing',
      page: '/fives',
    });
  });

  it('shows an administrator only their own organization’s feedback', async () => {
    const { service } = build();
    await service.create({ kind: FeedbackKind.QUESTION, message: 'How do I print labels?' }, member);
    await service.create({ kind: FeedbackKind.QUESTION, message: 'Someone else entirely' }, { id: 'x', organizationId: 'org-2' });

    const seen = await service.findAll({ id: 'admin', organizationId: 'org-1' });

    expect(seen.map((row) => row.message)).toEqual(['How do I print labels?']);
  });

  it('marks a message read once, and refuses another organization’s', async () => {
    const { service } = build();
    const saved = await service.create({ kind: FeedbackKind.SUGGESTION, message: 'Bigger buttons please' }, member);

    const read = await service.markRead(saved.id, member);
    expect(read.readAt).toBeInstanceOf(Date);

    await expect(service.markRead(saved.id, { organizationId: 'org-2' })).rejects.toThrow();
  });

  it('refuses a caller with no organization', () => {
    const { service } = build();
    expect(() => service.findAll({})).toThrow();
  });
});
