import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { attachmentService } from '../../services/attachment.service';

/**
 * The photograph of the area as it should look, to compare it against.
 *
 * A written standard - "tools on the shadow board, floor clear" - leaves
 * the auditor to picture it; the photograph is what they actually hold the
 * area up to (Fabrico shows it at the checklist for this reason). Taken in
 * the plan editor; shown here read-only, and nothing at all when there is
 * none.
 */
const StandardPhoto: React.FC<{ zoneId: string; className?: string }> = ({ zoneId, className = '' }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let loaded: string | null = null;

    attachmentService
      .list('five_s_zone', zoneId)
      .then((items) => {
        // The newest, if the standard has been photographed more than once.
        const standard = items.filter((item) => item.kind === 'standard').pop();
        return standard ? attachmentService.loadFile(standard) : null;
      })
      .then((objectUrl) => {
        if (!objectUrl) return;
        if (!active) {
          attachmentService.releaseFile(objectUrl);
          return;
        }
        loaded = objectUrl;
        setUrl(objectUrl);
      })
      .catch(() => undefined);

    return () => {
      active = false;
      if (loaded) attachmentService.releaseFile(loaded);
    };
  }, [zoneId]);

  if (!url) return null;

  return (
    <figure className={className} data-testid="standard-photo">
      <img
        src={url}
        alt={t('zone.standardPhotoAlt')}
        className="max-h-72 w-full rounded-lg border border-gray-200 object-cover dark:border-gray-700"
      />
      <figcaption className="mt-1 text-xs text-gray-600 dark:text-gray-400">{t('zone.standardPhotoCaption')}</figcaption>
    </figure>
  );
};

export default StandardPhoto;
