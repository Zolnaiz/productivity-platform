/**
 * Side panel for the selected floor-plan object (machine, shelf, desk): size, rotation, label. Split from
 * FiveSFloorPlanSetup.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Move, RotateCw, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import { fieldClass } from './floorPlanPresets';
import { CANVAS_HEIGHT, CANVAS_WIDTH, clamp } from './floorPlanGeometry';
import { formatSize, toMetres, toUnits } from './floorPlanScale';
import { FloorPlanObject } from '../../types/fiveS.types';

export interface FloorPlanObjectInspectorProps {
  deleteSelectedObject: () => void;
  duplicateSelectedObject: () => void;
  metresPerUnit: number;
  selectedObject: FloorPlanObject;
  updateObject: (objectId: string, patch: Partial<FloorPlanObject>, options?: { skipHistory?: boolean }) => void;
}

/**
 * The right-hand panel while a piece of furniture or equipment is selected:
 * its name, size in metres, rotation and layer, and duplicate or delete.
 */
const FloorPlanObjectInspector: React.FC<FloorPlanObjectInspectorProps> = ({
  deleteSelectedObject,
  duplicateSelectedObject,
  metresPerUnit,
  selectedObject,
  updateObject,
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <Move className="h-4 w-4" />
            {t('fiveS.ui.selectedObject')}
          </div>
          <div className="mt-1 text-xs capitalize text-gray-500">{selectedObject.type}</div>
        </div>
        <button
          type="button"
          onClick={deleteSelectedObject}
          className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
          aria-label={t('fiveS.ui.deleteSelectedObject')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        {t('fiveS.inspector.label')}
        <input
          className={fieldClass}
          value={selectedObject.label}
          onChange={(event) => updateObject(selectedObject.id, { label: event.target.value })}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          X
          <input
            className={fieldClass}
            min={0}
            max={CANVAS_WIDTH - selectedObject.width}
            type="number"
            value={Math.round(selectedObject.x)}
            onChange={(event) =>
              updateObject(selectedObject.id, {
                x: clamp(Number(event.target.value), 0, CANVAS_WIDTH - selectedObject.width),
              })
            }
          />
        </label>
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          Y
          <input
            className={fieldClass}
            min={0}
            max={CANVAS_HEIGHT - selectedObject.height}
            type="number"
            value={Math.round(selectedObject.y)}
            onChange={(event) =>
              updateObject(selectedObject.id, {
                y: clamp(Number(event.target.value), 0, CANVAS_HEIGHT - selectedObject.height),
              })
            }
          />
        </label>
      </div>
      {/*
        In metres, because that is what the thing measures. These
        read 65 and 26 until now — canvas units, a number with no
        meaning outside this one drawing, which nobody could check
        against a tape measure or a supplier's page.
      */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          {t('fiveS.widthMetres')}
          <input
            className={fieldClass}
            min={0.1}
            step={0.1}
            type="number"
            value={Number(toMetres(selectedObject.width, metresPerUnit).toFixed(2))}
            onChange={(event) => {
              const metres = Number(event.target.value);
              if (!Number.isFinite(metres) || metres <= 0) return;

              updateObject(selectedObject.id, {
                width: clamp(toUnits(metres, metresPerUnit), 4, CANVAS_WIDTH - selectedObject.x),
              });
            }}
          />
        </label>
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          {t('fiveS.heightMetres')}
          <input
            className={fieldClass}
            min={0.1}
            step={0.1}
            type="number"
            value={Number(toMetres(selectedObject.height, metresPerUnit).toFixed(2))}
            onChange={(event) => {
              const metres = Number(event.target.value);
              if (!Number.isFinite(metres) || metres <= 0) return;

              updateObject(selectedObject.id, {
                height: clamp(toUnits(metres, metresPerUnit), 4, CANVAS_HEIGHT - selectedObject.y),
              });
            }}
          />
        </label>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {formatSize({ width: selectedObject.width, height: selectedObject.height }, metresPerUnit)}
      </p>
      <Button
        fullWidth
        variant="outline"
        icon={RotateCw}
        onClick={() =>
          updateObject(selectedObject.id, {
            rotation: ((selectedObject.rotation || 0) + 45) % 360,
          })
        }
        type="button"
      >
        {t('fiveS.ui.rotate45')}
      </Button>
      <Button fullWidth variant="outline" icon={Copy} onClick={duplicateSelectedObject} type="button">
        {t('fiveS.ui.duplicateObject')}
      </Button>
    </div>
  );
};

export default FloorPlanObjectInspector;
