import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as request from 'supertest';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './entities/attachment.entity';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { UserRole } from '../shared/constants';
import { configureRequestHandling } from '../app-config';
import { MetricsService } from '../shared/metrics/metrics.service';

/**
 * Uploading a photograph, through the real interceptor.
 *
 * Everything else about attachments is tested against the service directly,
 * with a file object built by hand. That misses the part most likely to break
 * on an upgrade: multer is pinned inside `@nestjs/platform-express`, and the
 * only way to know a new one still parses a multipart body is to send one.
 */
describe('uploading an attachment over HTTP', () => {
  let app: INestApplication;
  let uploadDir: string;
  const rows: Array<Record<string, unknown>> = [];

  const tokenFor = (role: UserRole) => ({
    sub: 'u1',
    email: 'bat@example.com',
    role,
    organizationId: 'org-1',
  });

  let verified: Record<string, unknown> | null = tokenFor(UserRole.USER);

  const as = () => 'Bearer token';

  /** Four bytes of a JPEG header, which is what the service sniffs for. */
  const jpeg = () => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 7)]);

  beforeAll(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), 'attachments-http-'));

    const repository = {
      create: jest.fn((value: Record<string, unknown>) => ({ id: 'attachment-1', ...value })),
      save: jest.fn(async (value: Record<string, unknown>) => {
        rows.push(value);
        return value;
      }),
      find: jest.fn(async () => rows),
      findOne: jest.fn(async () => rows[0] ?? null),
      remove: jest.fn(async (row: Record<string, unknown>) => row),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [
        AttachmentsService,
        OperationsAuthGuard,
        PermissionsGuard,
        MetricsService,
        { provide: JwtService, useValue: { verify: () => verified } },
        {
          provide: ConfigService,
          useValue: { get: (key: string, fallback?: string) => (key === 'UPLOAD_DIR' ? uploadDir : fallback) },
        },
        { provide: getRepositoryToken(Attachment), useValue: repository },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // The same pipes, filters and prefix the application runs with, so this
    // exercises the stack rather than a controller in isolation.
    configureRequestHandling(app, moduleRef.get(MetricsService));
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    verified = tokenFor(UserRole.USER);
    rows.length = 0;
  });

  it('accepts a photograph and stores it', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/attachments')
      .set('Authorization', as())
      .field('ownerType', 'five_s_red_tag')
      .field('ownerId', 'red-tag-1')
      .field('kind', 'before')
      .attach('file', jpeg(), 'before.jpg')
      .expect(201);

    // Through the application's response envelope, which is what a client
    // actually receives.
    expect(response.body.data).toMatchObject({
      ownerId: 'red-tag-1',
      fileName: 'before.jpg',
      mimeType: 'image/jpeg',
    });
  });

  it('refuses a request with no file rather than storing an empty row', async () => {
    await request(app.getHttpServer())
      .post('/api/attachments')
      .set('Authorization', as())
      .field('ownerType', 'five_s_red_tag')
      .field('ownerId', 'red-tag-1')
      .expect(400);
  });

  it('refuses something that is not an image or a PDF, whatever it is called', async () => {
    // The bytes are sniffed rather than the name trusted: `.jpg` on a script
    // is the oldest trick there is.
    await request(app.getHttpServer())
      .post('/api/attachments')
      .set('Authorization', as())
      .field('ownerType', 'five_s_red_tag')
      .field('ownerId', 'red-tag-1')
      .attach('file', Buffer.from('<?php echo 1; ?>'), 'photo.jpg')
      .expect(400);
  });

  it('refuses an upload from somebody who may not create one', async () => {
    verified = tokenFor(UserRole.VIEWER);

    await request(app.getHttpServer())
      .post('/api/attachments')
      .set('Authorization', as())
      .field('ownerType', 'five_s_red_tag')
      .field('ownerId', 'red-tag-1')
      .attach('file', jpeg(), 'before.jpg')
      .expect(403);
  });

  it('refuses an upload with no token at all', async () => {
    await request(app.getHttpServer())
      .post('/api/attachments')
      .field('ownerType', 'five_s_red_tag')
      .field('ownerId', 'red-tag-1')
      .attach('file', jpeg(), 'before.jpg')
      .expect(401);
  });
});
