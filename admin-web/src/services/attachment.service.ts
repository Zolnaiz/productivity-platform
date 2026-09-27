import { api, isDemoMode, localId, unwrapApiResponse } from './api';

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
  /** Which part of the record it shows - for an audit, the question. */
  part?: string | null;
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

/** Which attachments have lost their bytes, as the server's store sees it. */
export interface AttachmentStoreCheck {
  store: string;
  checked: number;
  missing: Array<Pick<Attachment, 'id' | 'ownerType' | 'ownerId' | 'kind' | 'fileName'> & { createdAt: string }>;
}

export const attachmentService = {
  check: async (): Promise<AttachmentStoreCheck> => {
    // The demo keeps its pictures in this browser, so they are all here.
    if (isDemoMode()) return { store: 'demo', checked: readDemo().length, missing: [] };

    const response = await api.get<AttachmentStoreCheck | { data: AttachmentStoreCheck }>('/attachments/check');
    return unwrapApiResponse(response.data);
  },

  /**
   * A record's files. `part` narrows them: a question's id to that question's,
   * `null` to the record-as-a-whole's, left out to all of them.
   */
  list: async (ownerType: AttachmentOwner, ownerId: string, part?: string | null): Promise<Attachment[]> => {
    if (isDemoMode()) {
      return readDemo().filter(
        (item) =>
          item.ownerType === ownerType &&
          item.ownerId === ownerId &&
          (part === undefined || (item.part ?? null) === part),
      );
    }

    // The server wraps every answer as `{ success, data }`. Read raw, the list
    // was the envelope, and the photographs panel failed on every real page.
    const response = await api.get<Attachment[] | { data: Attachment[] }>('/attachments', {
      params: { ownerType, ownerId, ...(part === undefined ? {} : { part: part ?? '' }) },
    });
    return unwrapApiResponse(response.data);
  },

  upload: async (
    file: File,
    target: { ownerType: AttachmentOwner; ownerId: string; kind?: AttachmentKind; part?: string | null },
    caption?: string,
  ): Promise<Attachment> => {
    if (isDemoMode()) {
      const item = {
        id: localId('local-attachment'),
        ownerType: target.ownerType,
        ownerId: target.ownerId,
        kind: target.kind ?? 'evidence',
        part: target.part ?? null,
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
    if (target.part) form.append('part', target.part);
    if (caption) form.append('caption', caption);

    const response = await api.post<Attachment | { data: Attachment }>('/attachments', form);
    return unwrapApiResponse(response.data);
  },

  remove: async (id: string): Promise<void> => {
    if (isDemoMode()) {
      writeDemo(readDemo().filter((item) => item.id !== id));
      return;
    }

    await api.delete(`/attachments/${id}`);
  },

  /**
   * A URL an `<img>` can display.
   *
   * The file endpoint is guarded by a Bearer token, and a plain `<img src>` is
   * a browser request that carries no Authorization header — pointing one at
   * the endpoint renders a broken image for every signed-in user. So the bytes
   * come through the authenticated client and become an object URL, which the
   * caller must release.
   */
  loadFile: async (attachment: Attachment): Promise<string> => {
    if (isDemoMode()) {
      return readDemo().find((item) => item.id === attachment.id)?.dataUrl || '';
    }

    const response = await api.get<Blob>(`/attachments/${attachment.id}/file`, {
      responseType: 'blob',
    });

    return URL.createObjectURL(response.data);
  },

  /** Frees an object URL. A data URL from the demo store needs no release. */
  releaseFile: (url: string) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  },
};
