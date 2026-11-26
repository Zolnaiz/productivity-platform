import { randomUUID } from 'node:crypto';
import { AttachmentKind, AttachmentOwner } from './entities/attachment.entity';
import { apiError, ErrorCode } from '../shared/errors/api-error';

/**
 * What may be uploaded, and the extension each type is stored under.
 *
 * The extension comes from this table, never from the filename a client sent —
 * a name like `../../server.js` or `photo.jpg.exe` must not be able to steer
 * where the bytes land or what they are served as.
 */
const allowedTypes: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'application/pdf': '.pdf',
  // Office documents, for a task's work documents (deliverables.ts). Macro-enabled files are refused below.
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
};

/**
 * An Office Open XML file is a zip whose part names say what it is: `word/`, `xl/` or `ppt/`. A zip with none
 * of them is not accepted (any zip could carry anything), and one with a VBA project is a macro-enabled file
 * renamed, which is refused rather than stored: downloads are served as attachments, but a macro is code.
 */
const officeTypeOf = (buffer: Buffer): string | null => {
  if (!buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) return null;
  const names = buffer.toString('latin1');
  if (!names.includes('[Content_Types].xml') || names.includes('vbaProject.bin')) return null;
  if (names.includes('word/')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (names.includes('xl/')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (names.includes('ppt/')) return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  return null;
};

/** Phone photos are routinely 5-8 MB; a 5S board rarely needs more than this. */
export const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024;

/** Magic numbers, so the stored type is what the bytes are and not what a client claimed. */
const signatures: Array<{ mimeType: string; test: (buffer: Buffer) => boolean }> = [
  { mimeType: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mimeType: 'image/png',
    test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mimeType: 'image/webp',
    test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  {
    mimeType: 'image/heic',
    test: (b) => b.subarray(4, 8).toString('ascii') === 'ftyp' && /hei[cx]|mif1/.test(b.subarray(8, 12).toString('ascii')),
  },
  { mimeType: 'application/pdf', test: (b) => b.subarray(0, 5).toString('ascii') === '%PDF-' },
];

/**
 * The real type of an upload, read from its first bytes.
 *
 * A browser's declared Content-Type is a hint from the client and is trusted
 * for nothing. Returns null when the bytes are not a type we accept.
 */
export const sniffMimeType = (buffer: Buffer): string | null => {
  if (buffer.length < 12) return null;

  return signatures.find((signature) => signature.test(buffer))?.mimeType ?? officeTypeOf(buffer);
};

/** A storage key that cannot escape the upload directory. */
export const buildStorageKey = (mimeType: string) => `${randomUUID()}${allowedTypes[mimeType]}`;

/**
 * Strips a client filename down to something safe to store and display.
 *
 * Path separators, traversal and control characters are removed; the result is
 * a label only — the bytes live under `storageKey`.
 */
export const safeFileName = (name: string) => {
  const base = name.split(/[\\/]/).pop() ?? 'file';
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').replace(/^\.+/, '').trim();

  return (cleaned || 'file').slice(0, 120);
};

const isEnumValue = <T extends Record<string, string>>(values: T, value: unknown): value is T[keyof T] =>
  typeof value === 'string' && Object.values(values).includes(value);

/** Validates the multipart fields, which arrive as strings and are not typed. */
/**
 * The part of a record a file shows, or none. An id from the record's own
 * JSON - a checklist question's - so a short string rather than a UUID.
 */
export const parseAttachmentPart = (part: unknown): string | undefined => {
  if (part === undefined || part === null || part === '') return undefined;

  if (typeof part !== 'string' || !part.trim() || part.trim().length > 100) {
    throw apiError(ErrorCode.ValidationFailed, 'part');
  }

  return part.trim();
};

export const parseAttachmentTarget = (ownerType: unknown, ownerId: unknown, kind: unknown) => {
  if (!isEnumValue(AttachmentOwner, ownerType)) {
    throw apiError(ErrorCode.ValidationFailed, 'ownerType');
  }

  if (typeof ownerId !== 'string' || !ownerId.trim()) {
    throw apiError(ErrorCode.ValidationFailed, 'ownerId');
  }

  if (kind !== undefined && !isEnumValue(AttachmentKind, kind)) {
    throw apiError(ErrorCode.ValidationFailed, 'kind');
  }

  return {
    ownerType,
    ownerId: ownerId.trim(),
    kind: (kind as AttachmentKind | undefined) ?? AttachmentKind.EVIDENCE,
  };
};

export const isAllowedMimeType = (mimeType: string) => mimeType in allowedTypes;
