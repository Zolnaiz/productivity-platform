import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * What an attachment belongs to.
 *
 * 5S runs on evidence: a red tag is a claim until there is a photograph of the
 * item, and an audit score is an opinion until the before and after shots sit
 * beside it. Ids for red tags and zones live in the floor plan's JSON rather
 * than a table, so `ownerId` is a plain string and not a foreign key.
 */
export enum AttachmentOwner {
  RED_TAG = 'five_s_red_tag',
  ZONE = 'five_s_zone',
  AUDIT_RUN = 'audit_run',
  IMPROVEMENT = 'five_s_improvement',
  WORK_LOG = 'work_log',
}

/**
 * What the photograph is for.
 *
 * `standard` is the picture of how an area should look — the thing an auditor
 * compares reality against. `before` and `after` are the pair that proves a
 * finding was actually fixed.
 */
export enum AttachmentKind {
  BEFORE = 'before',
  AFTER = 'after',
  EVIDENCE = 'evidence',
  STANDARD = 'standard',
}

@Entity('attachments')
@Index(['organizationId'])
@Index(['ownerType', 'ownerId'])
export class Attachment extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ type: 'varchar', name: 'owner_type' })
  ownerType: AttachmentOwner;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ type: 'varchar', default: AttachmentKind.EVIDENCE })
  kind: AttachmentKind;

  /** The name the uploader's file had. Shown to people; never used as a path. */
  @Column({ name: 'file_name' })
  fileName: string;

  /**
   * Where the bytes are. Generated server-side from a random id and an
   * extension derived from the sniffed type, so nothing a client sends can
   * steer the filesystem.
   */
  @Column({ name: 'storage_key' })
  storageKey: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ type: 'int', name: 'size_bytes' })
  sizeBytes: number;

  @Column({ name: 'uploaded_by', nullable: true })
  uploadedBy?: string;

  @Column({ type: 'text', nullable: true })
  caption?: string;
}
