import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';
import { apiErrorMessage } from '../../i18n/apiError';
import {
  Attachment,
  AttachmentKind,
  AttachmentOwner,
  attachmentService,
} from '../../services/attachment.service';

interface PhotoEvidenceProps {
  ownerType: AttachmentOwner;
  ownerId: string;
  /**
   * The slots to offer. `['before', 'after']` renders the pair a 5S board
   * actually shows; a single kind renders one column.
   */
  kinds?: AttachmentKind[];
  /** Names the group for assistive technology when several appear on a page. */
  label?: string;
}

/**
 * Photographs attached to a record.
 *
 * 5S runs on evidence: a red tag is a claim until there is a picture of the
 * item, and a fix is unproven until the after shot sits beside the before one.
 * This is the same component wherever that pair is needed.
 */
const PhotoEvidence: React.FC<PhotoEvidenceProps> = ({
  ownerType,
  ownerId,
  kinds = ['before', 'after'],
  label,
}) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<AttachmentKind | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<Attachment | null>(null);
  const inputs = useRef<Partial<Record<AttachmentKind, HTMLInputElement | null>>>({});

  const load = useCallback(async () => {
    try {
      setItems(await attachmentService.list(ownerType, ownerId));
      setError(null);
    } catch (loadError) {
      setError(apiErrorMessage(loadError, t));
    }
  }, [ownerType, ownerId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFile = async (kind: AttachmentKind, file: File | undefined) => {
    if (!file) return;

    setUploading(kind);
    setError(null);

    try {
      await attachmentService.upload(file, { ownerType, ownerId, kind });
      await load();
    } catch (uploadError) {
      setError(apiErrorMessage(uploadError, t));
    } finally {
      setUploading(null);
      // Clearing the input lets the same file be chosen again after a failure.
      const input = inputs.current[kind];
      if (input) input.value = '';
    }
  };

  const confirmRemoval = async () => {
    if (!pendingRemoval) return;

    try {
      await attachmentService.remove(pendingRemoval.id);
      await load();
    } catch (removeError) {
      setError(apiErrorMessage(removeError, t));
    } finally {
      setPendingRemoval(null);
    }
  };

  return (
    <div className="space-y-2" aria-label={label}>
      <div className={`grid gap-3 ${kinds.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {kinds.map((kind) => {
          const shot = items.find((item) => item.kind === kind);
          const inputId = `photo-${ownerId}-${kind}`;

          return (
            <div
              key={kind}
              className="rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600"
            >
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t(`photos.${kind}`)}
              </div>

              {shot ? (
                <div className="space-y-2">
                  <img
                    src={attachmentService.fileUrl(shot)}
                    alt={t('photos.shotAlt', { kind: t(`photos.${kind}`), name: shot.fileName })}
                    className="h-32 w-full rounded-md object-cover"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-gray-500" title={shot.fileName}>
                      {shot.fileName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      type="button"
                      aria-label={t('photos.remove', { kind: t(`photos.${kind}`) })}
                      onClick={() => setPendingRemoval(shot)}
                    />
                  </div>
                </div>
              ) : (
                <label
                  htmlFor={inputId}
                  className="flex h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-md bg-gray-50 text-xs text-gray-500 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <Camera className="h-5 w-5" aria-hidden="true" />
                  {uploading === kind ? t('photos.uploading') : t('photos.add')}
                </label>
              )}

              <input
                id={inputId}
                ref={(element) => {
                  inputs.current[kind] = element;
                }}
                className="sr-only"
                type="file"
                accept="image/*,application/pdf"
                // Phones open the camera directly rather than a file browser.
                capture="environment"
                disabled={uploading !== null}
                onChange={(event) => handleFile(kind, event.target.files?.[0])}
              />
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        isOpen={Boolean(pendingRemoval)}
        title={t('photos.removeTitle')}
        message={t('photos.removeMessage', { name: pendingRemoval?.fileName })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
};

export default PhotoEvidence;
