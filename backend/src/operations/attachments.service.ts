import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment, AttachmentKind, AttachmentOwner } from './entities/attachment.entity';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { buildStorageKey, safeFileName, sniffMimeType } from './attachment-storage';

type CurrentUser = {
  id?: string;
  organizationId?: string;
};

export interface UploadedAttachment {
  originalname: string;
  buffer: Buffer;
  size: number;
}

/**
 * Photographs and documents attached to 5S records.
 *
 * The bytes live on disk under a server-generated key; the row carries the
 * name a person recognises. Nothing a client sends reaches the filesystem, and
 * every read is filtered by organization — a photograph of one tenant's shop
 * floor must never be reachable from another's session.
 */
@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    @InjectRepository(Attachment) private readonly attachments: Repository<Attachment>,
    private readonly configService: ConfigService,
  ) {}

  /** Absolute, resolved once, so a key can never be joined into an escape. */
  private get storageRoot() {
    return resolve(this.configService.get<string>('UPLOAD_DIR', './uploads'));
  }

  private organizationWhere(user: CurrentUser) {
    if (!user?.organizationId) {
      throw apiError(ErrorCode.AuthOrganizationRequired);
    }

    return { organizationId: user.organizationId };
  }

  async upload(
    file: UploadedAttachment | undefined,
    target: { ownerType: AttachmentOwner; ownerId: string; kind: AttachmentKind },
    caption: string | undefined,
    user: CurrentUser,
  ) {
    const where = this.organizationWhere(user);

    if (!file?.buffer?.length) {
      throw apiError(ErrorCode.ValidationFailed, 'file');
    }

    // The declared Content-Type is a hint from the client. What matters is
    // what the bytes actually are.
    const mimeType = sniffMimeType(file.buffer);

    if (!mimeType) {
      throw apiError(ErrorCode.UnsupportedFileType);
    }

    const storageKey = buildStorageKey(mimeType);
    await mkdir(this.storageRoot, { recursive: true });
    await writeFile(join(this.storageRoot, storageKey), file.buffer);

    const attachment = this.attachments.create({
      ...where,
      ownerType: target.ownerType,
      ownerId: target.ownerId,
      kind: target.kind,
      fileName: safeFileName(file.originalname || 'file'),
      storageKey,
      mimeType,
      sizeBytes: file.size ?? file.buffer.length,
      uploadedBy: user?.id,
      caption: caption?.slice(0, 500),
    });

    return this.attachments.save(attachment);
  }

  findForOwner(ownerType: AttachmentOwner, ownerId: string, user: CurrentUser) {
    return this.attachments.find({
      where: { ...this.organizationWhere(user), ownerType, ownerId },
      order: { createdAt: 'ASC' },
    });
  }

  private async findScoped(id: string, user: CurrentUser) {
    const attachment = await this.attachments.findOne({
      where: { ...this.organizationWhere(user), id },
    });

    if (!attachment) {
      throw apiError(ErrorCode.ResourceNotFound, 'Attachment');
    }

    return attachment;
  }

  /**
   * The bytes, for streaming back.
   *
   * The path is built from the stored key only, and the key was generated as a
   * random id plus a known extension — so there is no client-supplied text
   * anywhere in it.
   */
  async read(id: string, user: CurrentUser) {
    const attachment = await this.findScoped(id, user);
    const buffer = await readFile(join(this.storageRoot, attachment.storageKey));

    return { attachment, buffer };
  }

  async remove(id: string, user: CurrentUser) {
    const attachment = await this.findScoped(id, user);

    await this.attachments.remove(attachment);

    // The row is the record; a leftover file is untidy, not incorrect. Losing
    // the row because the file had already gone would be worse.
    try {
      await unlink(join(this.storageRoot, attachment.storageKey));
    } catch (error) {
      this.logger.warn(`Attachment file already gone: ${attachment.storageKey}`);
    }

    return { id, deleted: true };
  }
}
