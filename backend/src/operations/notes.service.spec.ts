import { NotesService } from './notes.service';

describe('NotesService', () => {
  const build = () => {
    const rows: any[] = [];
    const repository = {
      create: jest.fn((value) => ({ id: `n${rows.length + 1}`, ...value })),
      save: jest.fn(async (value) => (rows.includes(value) ? value : (rows.push(value), value))),
      find: jest.fn(async ({ where }) => rows.filter((row) => row.organizationId === where.organizationId && row.userId === where.userId)),
      findOne: jest.fn(async ({ where }) => rows.find((row) => row.id === where.id && row.userId === where.userId && row.organizationId === where.organizationId) ?? null),
      softRemove: jest.fn(async (row) => rows.splice(rows.indexOf(row), 1)),
    };
    return { service: new NotesService(repository as never), rows };
  };
  const bat = { id: 'u1', organizationId: 'org-1' };
  const sara = { id: 'u2', organizationId: 'org-1' };

  it('keeps each note to its author, even inside one organization', async () => {
    const { service } = build();
    await service.create({ title: ' Shift notes ', content: 'Line 2 slow' }, bat);
    await service.create({ title: 'Mine' }, sara);

    expect((await service.findMine(bat)).map((note) => note.title)).toEqual(['Shift notes']);
    expect((await service.findMine(sara)).map((note) => note.title)).toEqual(['Mine']);
  });

  it('deletes only the author’s own note; another’s is not found', async () => {
    const { service, rows } = build();
    const note = await service.create({ title: 'Delete me' }, bat);

    await expect(service.remove(note.id, sara)).rejects.toMatchObject({ status: 404 });
    expect(rows).toHaveLength(1);
    await expect(service.remove(note.id, bat)).resolves.toEqual({ id: note.id, deleted: true });
    expect(rows).toHaveLength(0);
  });

  it('refuses a caller with no identity', () => {
    const { service } = build();
    expect(() => service.findMine({})).toThrow();
  });
});
