import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  createAttachmentStore,
  LocalAttachmentStore,
  S3AttachmentStore,
} from './attachment-store';

const config = (values: Record<string, unknown>) =>
  ({ get: (key: string) => values[key] }) as never;

const bytes = Buffer.from('a photograph of a tidy aisle');

/**
 * Where the evidence lives.
 *
 * Attachments were written to a directory inside the container, which does not
 * survive the container being replaced: a redeploy destroyed the photographs
 * while keeping every row that pointed at them. These are the two arrangements
 * a customer actually runs, and the choice between them.
 */
describe('keeping attachment bytes on a local disk', () => {
  it('reads back exactly what was written', async () => {
    const store = new LocalAttachmentStore(await mkdtemp(join(tmpdir(), 'store-')));

    // The type is not passed here on purpose: a file on a disk carries its
    // type in the row, not in the bytes' surroundings.
    await store.put('photo.jpg', bytes);

    expect(await store.get('photo.jpg')).toEqual(bytes);
  });

  it('creates the directory rather than failing the first upload', async () => {
    // A fresh volume is empty, and the first photograph of a deployment should
    // not be the one that discovers this.
    const root = join(await mkdtemp(join(tmpdir(), 'store-')), 'nested', 'uploads');
    const store = new LocalAttachmentStore(root);

    await store.put('photo.jpg', bytes);

    expect(await readFile(join(root, 'photo.jpg'))).toEqual(bytes);
  });

  it('refuses to read a file it never wrote', async () => {
    const store = new LocalAttachmentStore(await mkdtemp(join(tmpdir(), 'store-')));

    await expect(store.get('missing.jpg')).rejects.toBeDefined();
  });

  it('says whether the bytes are there without reading them', async () => {
    // What a restore check asks, thousands of times: pulling every photograph
    // through the process to answer yes or no would move gigabytes.
    const root = await mkdtemp(join(tmpdir(), 'store-'));
    const store = new LocalAttachmentStore(root);
    await writeFile(join(root, 'photo.jpg'), bytes);

    expect(await store.exists('photo.jpg')).toBe(true);
    expect(await store.exists('missing.jpg')).toBe(false);
  });

  it('removes the bytes it was asked to remove', async () => {
    const root = await mkdtemp(join(tmpdir(), 'store-'));
    const store = new LocalAttachmentStore(root);
    await writeFile(join(root, 'photo.jpg'), bytes);

    await store.remove('photo.jpg');

    await expect(store.get('photo.jpg')).rejects.toBeDefined();
  });
});

describe('keeping attachment bytes in an object store', () => {
  const s3 = () => {
    const sent: Array<Record<string, unknown>> = [];
    const client = {
      send: jest.fn(async (command: { input: Record<string, unknown> }) => {
        sent.push(command.input);

        return {
          Body: { transformToByteArray: async () => new Uint8Array(bytes) },
        };
      }),
    };

    return { client, sent, store: new S3AttachmentStore(client as never, 'evidence') };
  };

  it('writes the object into the configured bucket, under the key it was given', async () => {
    const { store, sent } = s3();

    await store.put('photo.jpg', bytes, 'image/jpeg');

    expect(sent[0]).toMatchObject({
      Bucket: 'evidence',
      Key: 'photo.jpg',
      ContentType: 'image/jpeg',
    });
  });

  it('reads the object back as bytes', async () => {
    const { store } = s3();

    expect(await store.get('photo.jpg')).toEqual(bytes);
  });

  it('says so rather than returning an empty photograph', async () => {
    // A body that is not there is a fault, and an empty buffer served as a
    // photograph would look like a corrupted camera rather than a broken
    // deployment.
    const store = new S3AttachmentStore({ send: async () => ({}) } as never, 'evidence');

    await expect(store.get('photo.jpg')).rejects.toThrow(/without a body/);
  });

  it('answers no when the object cannot be reached at all', async () => {
    // Missing, or a bucket this deployment may not read: both answer the
    // question the caller actually asked, which is whether these bytes can be
    // served.
    const gone = new S3AttachmentStore(
      { send: async () => Promise.reject(new Error('NotFound')) } as never,
      'evidence',
    );
    const { store } = s3();

    expect(await gone.exists('photo.jpg')).toBe(false);
    expect(await store.exists('photo.jpg')).toBe(true);
  });

  it('deletes by key', async () => {
    const { store, sent } = s3();

    await store.remove('photo.jpg');

    expect(sent[0]).toMatchObject({ Bucket: 'evidence', Key: 'photo.jpg' });
  });
});

describe('choosing the store a deployment runs', () => {
  it('keeps local disk when nothing is configured', () => {
    // The default has to work with no setup at all: a customer running one
    // machine should not have to stand up an object store to attach a photo.
    const store = createAttachmentStore(config({}));

    expect(store.describe()).toBe(`local disk at ${resolve('./uploads')}`);
  });

  it('uses the directory it was given', () => {
    const store = createAttachmentStore(config({ UPLOAD_DIR: '/srv/evidence' }));

    expect(store.describe()).toContain(resolve('/srv/evidence'));
  });

  it('refuses to start as an object store with no bucket named', () => {
    // At startup, where somebody is watching the service come up — not at the
    // first upload, in the middle of an audit.
    expect(() => createAttachmentStore(config({ ATTACHMENT_STORE: 's3' }))).toThrow(/S3_BUCKET/);
  });

  it('names the endpoint it will use, so an operator can see it started right', () => {
    const store = createAttachmentStore(
      config({
        ATTACHMENT_STORE: 's3',
        S3_BUCKET: 'evidence',
        S3_ENDPOINT: 'https://minio.plant.local',
      }),
    );

    expect(store.describe()).toBe('https://minio.plant.local bucket evidence');
  });
});
