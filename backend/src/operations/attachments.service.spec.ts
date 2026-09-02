import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AttachmentsService } from './attachments.service';
import { AttachmentKind, AttachmentOwner } from './entities/attachment.entity';

const jpeg = () => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 7)]);

const createService = async () => {
  const uploadDir = await mkdtemp(join(tmpdir(), 'attachments-'));
  const rows: any[] = [];

  const repository = {
    create: jest.fn((value) => ({ id: `attachment-${rows.length + 1}`, ...value })),
    save: jest.fn(async (value) => {
      rows.push(value);
      return value;
    }),
    find: jest.fn(async ({ where }) =>
      rows.filter(
        (row) =>
          row.organizationId === where.organizationId &&
          row.ownerType === where.ownerType &&
          row.ownerId === where.ownerId,
      ),
    ),
    findOne: jest.fn(async ({ where }) =>
      rows.find((row) => row.id === where.id && row.organizationId === where.organizationId) ?? null,
    ),
    remove: jest.fn(async (row) => {
      rows.splice(rows.indexOf(row), 1);
      return row;
    }),
  };

  const configService = { get: jest.fn((_key: string, fallback: string) => uploadDir || fallback) };
  const service = new AttachmentsService(repository as any, configService as any);

  return { service, repository, uploadDir, rows };
};

const owner = { ownerType: AttachmentOwner.RED_TAG, ownerId: 'red-tag-1', kind: AttachmentKind.BEFORE };
type Caller = { id?: string; organizationId?: string };

const user: Caller = { id: 'user-1', organizationId: 'org-1' };
const otherTenant: Caller = { id: 'user-2', organizationId: 'org-2' };

const upload = (service: AttachmentsService, as: Caller = user, buffer = jpeg(), name = 'before.jpg') =>
  service.upload({ originalname: name, buffer, size: buffer.length }, owner, undefined, as);

describe('attachment uploads', () => {
  it('stores the bytes and records what they are', async () => {
    const { service, uploadDir } = await createService();

    const saved = await upload(service);

    expect(saved.mimeType).toBe('image/jpeg');
    expect(saved.fileName).toBe('before.jpg');
    expect(await readFile(join(uploadDir, saved.storageKey))).toEqual(jpeg());
  });

  it('names the stored file itself, ignoring what the client called it', async () => {
    const { service, uploadDir } = await createService();

    const saved = await upload(service, user, jpeg(), '../../../etc/passwd');

    // The label is sanitised; the path on disk shares nothing with it.
    expect(saved.fileName).toBe('passwd');
    expect(saved.storageKey).toMatch(/^[0-9a-f-]{36}\.jpg$/);
    expect(await readdir(uploadDir)).toEqual([saved.storageKey]);
  });

  it('refuses a file whose bytes are not a type we accept', async () => {
    const { service } = await createService();
    const script = Buffer.from('<?php system($_GET[0]); ?>');

    await expect(
      service.upload({ originalname: 'photo.jpg', buffer: script, size: script.length }, owner, undefined, user),
    ).rejects.toMatchObject({ response: { errorCode: 'UNSUPPORTED_FILE_TYPE' } });
  });

  it('writes nothing to disk when the upload is refused', async () => {
    const { service, uploadDir } = await createService();
    const script = Buffer.from('MZ executable');

    await expect(
      service.upload({ originalname: 'x.jpg', buffer: script, size: script.length }, owner, undefined, user),
    ).rejects.toBeTruthy();

    await expect(readdir(uploadDir)).resolves.toEqual([]);
  });

  it('refuses an empty upload', async () => {
    const { service } = await createService();

    await expect(
      service.upload(undefined, owner, undefined, user),
    ).rejects.toMatchObject({ response: { errorCode: 'VALIDATION_FAILED' } });
  });

  it('refuses to store anything without an organization', async () => {
    const { service } = await createService();

    await expect(upload(service, { id: 'user-3' })).rejects.toMatchObject({
      response: { errorCode: 'AUTH_ORGANIZATION_REQUIRED' },
    });
  });
});

describe('attachment reads are scoped to one tenant', () => {
  it('does not list another organization photographs', async () => {
    const { service } = await createService();
    await upload(service);

    const mine = await service.findForOwner(owner.ownerType, owner.ownerId, user);
    const theirs = await service.findForOwner(owner.ownerType, owner.ownerId, otherTenant);

    expect(mine).toHaveLength(1);
    expect(theirs).toHaveLength(0);
  });

  it('does not serve another organization file, even with the right id', async () => {
    const { service } = await createService();
    const saved = await upload(service);

    await expect(service.read(saved.id, otherTenant)).rejects.toMatchObject({
      response: { errorCode: 'RESOURCE_NOT_FOUND' },
    });
    await expect(service.read(saved.id, user)).resolves.toBeTruthy();
  });

  it('does not let another organization delete a file', async () => {
    const { service } = await createService();
    const saved = await upload(service);

    await expect(service.remove(saved.id, otherTenant)).rejects.toBeTruthy();
    await expect(service.read(saved.id, user)).resolves.toBeTruthy();
  });
});

describe('deleting an attachment', () => {
  it('removes the row and the file', async () => {
    const { service, uploadDir } = await createService();
    const saved = await upload(service);

    await service.remove(saved.id, user);

    expect(await readdir(uploadDir)).toEqual([]);
    expect(await service.findForOwner(owner.ownerType, owner.ownerId, user)).toHaveLength(0);
  });

  it('still removes the row when the file has already gone', async () => {
    const { service, uploadDir } = await createService();
    const saved = await upload(service);
    await (await import('node:fs/promises')).unlink(join(uploadDir, saved.storageKey));

    // The row is the record. Losing it because the bytes vanished first would
    // leave an attachment nobody can see and nobody can clear.
    await expect(service.remove(saved.id, user)).resolves.toEqual({ id: saved.id, deleted: true });
  });
});
