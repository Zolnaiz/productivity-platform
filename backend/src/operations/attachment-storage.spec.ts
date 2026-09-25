import {
  buildStorageKey,
  isAllowedMimeType,
  parseAttachmentTarget,
  safeFileName,
  sniffMimeType,
} from './attachment-storage';
import { AttachmentKind, AttachmentOwner } from './entities/attachment.entity';

const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)]);
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);
const pdf = Buffer.concat([Buffer.from('%PDF-1.7'), Buffer.alloc(16)]);
const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)]);

describe('sniffMimeType', () => {
  it('reads the type from the bytes, not from what the client claimed', () => {
    expect(sniffMimeType(jpeg)).toBe('image/jpeg');
    expect(sniffMimeType(png)).toBe('image/png');
    expect(sniffMimeType(pdf)).toBe('application/pdf');
    expect(sniffMimeType(webp)).toBe('image/webp');
  });

  it('rejects an executable renamed to look like a photo', () => {
    // The classic upload attack: photo.jpg whose bytes are a Windows binary.
    const exe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(32)]);

    expect(sniffMimeType(exe)).toBeNull();
  });

  it('rejects a script, however it is labelled', () => {
    expect(sniffMimeType(Buffer.from('<?php system($_GET[0]); ?>'))).toBeNull();
    expect(sniffMimeType(Buffer.from('#!/bin/sh\nrm -rf /'))).toBeNull();
  });

  it('rejects a file too short to identify', () => {
    expect(sniffMimeType(Buffer.from([0xff, 0xd8]))).toBeNull();
  });
});

describe('buildStorageKey', () => {
  it('never reuses a key', () => {
    const keys = new Set(Array.from({ length: 200 }, () => buildStorageKey('image/jpeg')));

    expect(keys.size).toBe(200);
  });

  it('takes the extension from the sniffed type, not from any filename', () => {
    expect(buildStorageKey('image/png')).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(buildStorageKey('application/pdf')).toMatch(/\.pdf$/);
  });

  it('produces a key with no path in it', () => {
    const key = buildStorageKey('image/jpeg');

    expect(key).not.toMatch(/[\/]/);
    expect(key).not.toContain('..');
  });
});

describe('safeFileName', () => {
  it('keeps an ordinary name', () => {
    expect(safeFileName('reception-before.jpg')).toBe('reception-before.jpg');
  });

  it('strips a traversal attempt down to its last segment', () => {
    expect(safeFileName('../../../etc/passwd')).toBe('passwd');
    expect(safeFileName(String.raw`..\..\windows\system32\cmd.exe`)).toBe('cmd.exe');
  });

  it('refuses to produce a name that is only dots', () => {
    expect(safeFileName('..')).toBe('file');
    expect(safeFileName('.')).toBe('file');
    expect(safeFileName('')).toBe('file');
  });

  it('removes control characters', () => {
    expect(safeFileName('photo\u0000.jpg')).toBe('photo.jpg');
  });

  it('caps the length', () => {
    expect(safeFileName('a'.repeat(500)).length).toBe(120);
  });
});

describe('parseAttachmentTarget', () => {
  it('accepts a known owner and kind', () => {
    expect(parseAttachmentTarget(AttachmentOwner.RED_TAG, 'red-tag-1', AttachmentKind.BEFORE)).toEqual({
      ownerType: AttachmentOwner.RED_TAG,
      ownerId: 'red-tag-1',
      kind: AttachmentKind.BEFORE,
    });
  });

  it('defaults an unspecified kind to evidence', () => {
    expect(parseAttachmentTarget(AttachmentOwner.AUDIT_RUN, 'run-1', undefined).kind).toBe(
      AttachmentKind.EVIDENCE,
    );
  });

  it('rejects an owner type it does not know', () => {
    expect(() => parseAttachmentTarget('payroll', 'x', undefined)).toThrow();
  });

  it('rejects a blank owner id', () => {
    expect(() => parseAttachmentTarget(AttachmentOwner.ZONE, '   ', undefined)).toThrow();
    expect(() => parseAttachmentTarget(AttachmentOwner.ZONE, undefined, undefined)).toThrow();
  });

  it('rejects a kind it does not know', () => {
    expect(() => parseAttachmentTarget(AttachmentOwner.ZONE, 'zone-1', 'secret')).toThrow();
  });
});

describe('isAllowedMimeType', () => {
  it('admits photographs and PDFs only', () => {
    expect(isAllowedMimeType('image/jpeg')).toBe(true);
    expect(isAllowedMimeType('application/pdf')).toBe(true);
    expect(isAllowedMimeType('text/html')).toBe(false);
    expect(isAllowedMimeType('image/svg+xml')).toBe(false);
  });
});
