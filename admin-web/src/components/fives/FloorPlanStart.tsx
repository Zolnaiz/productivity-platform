import React, { useRef } from 'react';
import { FileImage, PencilRuler } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_METRES_PER_UNIT, areaInMetres, formatArea } from './floorPlanScale';
import { detectRooms } from './floorPlanWalls';
import { Template, templates } from './floorPlanTemplates';

interface FloorPlanStartProps {
  onBlank: () => void;
  onTemplate: (template: Template) => void;
  onBlueprint: (dataUrl: string) => void;
}

/**
 * What somebody sees the first time, instead of somebody else's office.
 *
 * A new workspace used to open onto a pre-drawn sample building. This asks the
 * question that was being answered for them: is there a drawing of this place
 * already, should we start from a shape like it, or from nothing?
 *
 * Importing a drawing is first because it is the best answer whenever it is
 * available — a real building already has a plan somewhere, and tracing it is
 * both faster and more accurate than drawing from memory.
 */
const FloorPlanStart: React.FC<FloorPlanStartProps> = ({ onBlank, onTemplate, onBlueprint }) => {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const readBlueprint = (file: File | undefined) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && onBlueprint(reader.result);
    reader.readAsDataURL(file);
  };

  /** A thumbnail drawn from the template's own walls, so it cannot misrepresent it. */
  const preview = (template: Template) => {
    const xs = template.corners.map((corner) => corner.x);
    const ys = template.corners.map((corner) => corner.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const width = Math.max(...xs) - minX || 1;
    const height = Math.max(...ys) - minY || 1;
    const pad = Math.max(width, height) * 0.08;

    return (
      <svg
        viewBox={`${minX - pad} ${minY - pad} ${width + pad * 2} ${height + pad * 2}`}
        className="h-24 w-full"
        role="img"
        aria-label={t(`fiveS.templates.${template.id}`)}
      >
        {template.walls.map((wall) => {
          const from = template.corners.find((corner) => corner.id === wall.from);
          const to = template.corners.find((corner) => corner.id === wall.to);
          if (!from || !to) return null;

          return (
            <line
              key={wall.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="currentColor"
              strokeWidth={wall.thickness}
              strokeLinecap="square"
            />
          );
        })}
      </svg>
    );
  };

  const areaOfTemplate = (template: Template) =>
    detectRooms(template.walls, template.corners).reduce(
      (total, room) => total + areaInMetres(room.area, DEFAULT_METRES_PER_UNIT),
      0,
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('fiveS.startTitle')}</h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('fiveS.startSubtitle')}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-start gap-2 rounded-xl border-2 border-dashed border-gray-300 p-5 text-left hover:border-blue-400 hover:bg-blue-50/40 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-950/20"
        >
          <FileImage className="h-6 w-6 text-blue-600" aria-hidden="true" />
          <span className="font-medium text-gray-900 dark:text-white">{t('fiveS.startImport')}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('fiveS.startImportHint')}</span>
        </button>

        <button
          type="button"
          onClick={onBlank}
          className="flex flex-col items-start gap-2 rounded-xl border-2 border-dashed border-gray-300 p-5 text-left hover:border-blue-400 hover:bg-blue-50/40 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-950/20"
        >
          <PencilRuler className="h-6 w-6 text-gray-600 dark:text-gray-300" aria-hidden="true" />
          <span className="font-medium text-gray-900 dark:text-white">{t('fiveS.startBlank')}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('fiveS.startBlankHint')}</span>
        </button>
      </div>

      <input
        ref={fileRef}
        className="sr-only"
        type="file"
        accept="image/*"
        onChange={(event) => readBlueprint(event.target.files?.[0])}
      />

      <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {t('fiveS.startTemplates')}
      </h3>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onTemplate(template)}
            className="rounded-xl border border-gray-200 p-4 text-left text-gray-700 hover:border-blue-400 hover:bg-blue-50/40 dark:border-gray-700 dark:text-gray-200 dark:hover:border-blue-600 dark:hover:bg-blue-950/20"
          >
            {preview(template)}
            <span className="mt-2 block text-sm font-medium">{t(`fiveS.templates.${template.id}`)}</span>
            <span className="block text-xs tabular-nums text-gray-500 dark:text-gray-400">
              {template.metres.width} × {template.metres.depth} m · {formatArea(areaOfTemplate(template))}
            </span>
          </button>
        ))}
      </div>

      {/*
        Said plainly: a template is a shell of walls and nothing else. The part
        that is specific to a place — what is in it, who looks after it — is
        the part nobody else can supply.
      */}
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">{t('fiveS.startTemplateNote')}</p>
    </div>
  );
};

export default FloorPlanStart;
