/**
 * Palette of objects that can be dropped on the floor plan, grouped by catalogue. Split from
 * FiveSFloorPlanSetup.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Map as MapIcon, Plus, Square } from 'lucide-react';
import Button from '../common/Button';
import { shapeIcons, zoneColorPresets, zoneTemplates } from './floorPlanPresets';
import { stageKeys } from './floorPlanRules';
import { catalogue, catalogueGroups } from './floorPlanCatalogue';
import { FiveSStage, FloorPlanObjectType } from '../../types/fiveS.types';

export interface FloorPlanPaletteProps {
  addObject: (type: FloorPlanObjectType) => void;
  addZone: () => void;
  addZoneFromTemplate: (template: (typeof zoneTemplates)[number]) => void;
  stageCounts: Array<{ stage: FiveSStage; count: number }>;
}

/**
 * The left-hand palette: add an area, from blank or from a template, add
 * furniture and equipment from the catalogue, and the count of areas at each
 * 5S stage.
 */
const FloorPlanPalette: React.FC<FloorPlanPaletteProps> = ({
  addObject,
  addZone,
  addZoneFromTemplate,
  stageCounts,
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
        <MapIcon className="h-4 w-4" />
        {t('fiveS.ui.floorplan')}
      </div>
      <Button fullWidth size="sm" icon={Plus} onClick={addZone} type="button">
        {t('fiveS.ui.blankArea')}
      </Button>
      <div className="mt-4 max-h-[420px] space-y-4 overflow-y-auto pr-1 md:max-h-[520px]">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase text-gray-500">{t('fiveS.ui.areaPresets')}</div>
          <div className="grid grid-cols-2 gap-2">
            {zoneTemplates.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => addZoneFromTemplate(template)}
                className="flex min-h-[54px] flex-col items-start justify-between rounded-lg border border-gray-200 px-2.5 py-2 text-left text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <span className="h-2.5 w-8 rounded-full" style={{ backgroundColor: template.color }} />
                <span className="font-medium">{t(`fiveS.preset.${template.key}`)}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3 border-t border-gray-200 pt-3 dark:border-gray-700">
          {/*
            Each thing says what it measures. A person choosing between a
            desk and a workbench for a 3 m wall can see which one fits
            before placing it, and a size on the button is also the plain
            statement that these are real dimensions rather than shapes.
          */}
          {catalogueGroups.map((group) => (
            <div key={group}>
              <div className="mb-2 text-xs font-semibold uppercase text-gray-500">
                {t(`fiveS.catalogueGroup.${group}`)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {catalogue
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const Icon = shapeIcons[item.type] ?? Square;

                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => addObject(item.type)}
                        className="flex min-h-[42px] items-start gap-2 rounded-lg border border-gray-200 px-2.5 py-2 text-left text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <Icon className="mt-0.5 h-4 w-4 flex-none" />
                        <span className="leading-tight">
                          {t(`fiveS.object.${item.type}`)}
                          <span className="block text-[10px] tabular-nums text-gray-500 dark:text-gray-400">
                            {item.metres.width} × {item.metres.depth} m
                          </span>
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-gray-200 pt-3 dark:border-gray-700">
          {stageCounts.map((item) => (
            <div key={item.stage} className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{t(`fiveS.stage.${stageKeys[item.stage]}`)}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{item.count}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
          <div className="mb-2 text-xs font-semibold uppercase text-gray-500">{t('fiveS.ui.colorLegend')}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {zoneColorPresets.map((preset) => (
              <div key={preset.value} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span className="h-3 w-3 flex-none rounded-full" style={{ backgroundColor: preset.value }} />
                {t(`fiveS.colorPreset.${preset.key}`)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanPalette;
