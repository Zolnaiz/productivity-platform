import { api, isDemoMode } from './api';

export type AttachmentOwner =
  | 'five_s_red_tag'
  | 'five_s_zone'
  | 'audit_run'
  | 'five_s_improvement'
  | 'work_log';

export type AttachmentKind = 'before' | 'after' | 'evidence' | 'standard';

export interface Attachment {
  id: string;
  ownerType: AttachmentOwner;
  ownerId: string;
  kind: AttachmentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  caption?: string;
  createdAt?: string;
}

const storageKey = 'productivity-demo-attachments';

/**
 * The demo workspace keeps attachments as data URLs in browser storage.
 *
 * Photographs are the largest thing this product stores, and localStorage is
 * small, so the demo holds a downscaled copy — enough to show the before/after
 * pair working without pretending to be a file store.
 */
const readDemo = (): Array<Attachment & { dataUrl: string }> => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    localStorage.removeItem(storageKey);
    return [];
  }
};

const writeDemo = (items: Array<Attachment & { dataUrl: string }>) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch {
    // Storage full: the demo drops the oldest rather than failing the upload.
    localStorage.setItem(storageKey, JSON.stringify(items.slice(-8)));
  }
};

/** Shrinks an image so a demo attachment fits in browser storage. */
const toThumbnailDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => resolve(String(reader.result));
      image.onload = () => {
        const scale = Math.min(1, 640 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');

        if (!context) {
          resolve(String(reader.result));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

export const attachmentService = {
  list: async (ownerType: AttachmentOwner, ownerId: string): Promise<Attachment[]> => {
    if (isDemoMode()) {
      return readDemo().filter((item) => item.ownerType === ownerType && item.ownerId === ownerId);
    }

    const response = await api.get<Attachment[]>('/attachments', { params: { ownerType, ownerId } });
    return response.data;
  },

  upload: async (
    file: File,
    target: { ownerType: AttachmentOwner; ownerId: string; kind?: AttachmentKind },
    caption?: string,
  ): Promise<Attachment> => {
    if (isDemoMode()) {
      const item = {
        id: `local-attachment-${Date.now()}`,
        ownerType: target.ownerType,
        ownerId: target.ownerId,
        kind: target.kind ?? 'evidence',
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        caption,
        createdAt: new Date().toISOString(),
        dataUrl: await toThumbnailDataUrl(file),
      };

      writeDemo([...readDemo(), item]);
      return item;
    }

    const form = new FormData();
    form.append('file', file);
    form.append('ownerType', target.ownerType);
    form.append('ownerId', target.ownerId);
    if (target.kind) form.append('kind', target.kind);
    if (caption) form.append('caption', caption);

    const response = await api.post<Attachment>('/attachments', form);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    if (isDemoMode()) {
      writeDemo(readDemo().filter((item) => item.id !== id));
      return;
    }

    await api.delete(`/attachments/${id}`);
  },

  /** Where to point an `<img>`. Demo attachments carry their own data URL. */
  fileUrl: (attachment: Attachment): string => {
    if (isDemoMode()) {
      return readDemo().find((item) => item.id === attachment.id)?.dataUrl || '';
    }

    return `${api.defaults.baseURL}/attachments/${attachment.id}/file`;
  },
};
