/**
 * Tables under the floor-plan editor: area per room/zone, schedule and route lengths. Split from
 * FiveSFloorPlanSetup; receives everything as props.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Download, ListChecks, Map as MapIcon, UserCheck } from 'lucide-react';
import Button from '../common/Button';
import { EditorPart, OwnerCoverageRow, RedTagRow } from './floorPlanEditorTypes';
import { getAuditDueDate } from './auditSchedule';
import { isOpenRedTag, getRedTagCount, ZoneAction, getZoneActionItems, stageKeys } from './floorPlanRules';
import { summariseRooms, zonesInNoRoom } from './floorPlanRoomSummary';
import { routeLegs, routeLength } from './floorPlanRoutes';
import { formatArea, formatLength } from './floorPlanScale';
import { detectRooms } from './floorPlanWalls';
import { FiveSLayoutPlan, FiveSZone } from '../../types/fiveS.types';
import { scrollArea } from '../common/scrollArea';

export interface FloorPlanAreaTablesProps {
  downloadRedTagRegisterCsv: () => void;
  filteredZones: FiveSZone[];
  metresPerUnit: number;
  nextActionText: (actions: ZoneAction[]) => string;
  openRedTagItems: RedTagRow[];
  ownerCoverage: OwnerCoverageRow[];
  plan: FiveSLayoutPlan;
  redTagRegister: RedTagRow[];
  removeRoute: (routeId: string) => void;
  renameRoute: (routeId: string, name: string) => void;
  roomSummaries: ReturnType<typeof summariseRooms>;
  rooms: ReturnType<typeof detectRooms>;
  setOwnerFilter: (owner: string) => void;
  setSelectedObjectId: (objectId: string) => void;
  setSelectedZoneId: (zoneId: string) => void;
  show: (part: EditorPart) => boolean;
  showAuditControls: boolean;
  strayZones: ReturnType<typeof zonesInNoRoom>;
}

/**
 * The tables under the map on the areas tab: who owns which areas and how
 * they stand, the rooms and the areas in none, the routes drawn, the red-tag
 * register, and every area against the filters. Read-only views of the plan;
 * selecting a row selects that area or object in the editor.
 */
const FloorPlanAreaTables: React.FC<FloorPlanAreaTablesProps> = ({
  downloadRedTagRegisterCsv,
  filteredZones,
  metresPerUnit,
  nextActionText,
  openRedTagItems,
  ownerCoverage,
  plan,
  redTagRegister,
  removeRoute,
  renameRoute,
  roomSummaries,
  rooms,
  setOwnerFilter,
  setSelectedObjectId,
  setSelectedZoneId,
  show,
  showAuditControls,
  strayZones,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {show('areas') && (
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <UserCheck className="h-4 w-4" />
            {t('fiveS.ui.ownerCoverage')}
          </div>
          <span className="text-xs text-gray-500">{t('fiveS.ui.ownerGroups', { count: ownerCoverage.length })}</span>
        </div>
        <div className="grid gap-0 divide-y divide-gray-200 dark:divide-gray-700 md:grid-cols-2 md:divide-x md:divide-y-0">
          {ownerCoverage.map((owner) => (
            <button
              key={owner.id}
              type="button"
              className={`grid items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 ${
                showAuditControls ? 'grid-cols-[1fr_auto_auto_auto]' : 'grid-cols-[1fr_auto_auto]'
              }`}
              onClick={() => setOwnerFilter(owner.id)}
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{owner.name}</div>
                {showAuditControls ? (
                  <div className="text-xs text-gray-500">
                    {t('fiveS.ui.averageScore', {
                      score: owner.scoreCount ? `${Math.round(owner.scoreTotal / owner.scoreCount)}%` : '-',
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">{t('fiveS.ui.responsibleOwnership')}</div>
                )}
              </div>
              <div className="text-center text-xs text-gray-500">
                <div className="text-base font-semibold text-gray-900 dark:text-white">{owner.zones}</div>
                {t('fiveS.ownerCard.zones', { count: owner.zones })}
              </div>
              <div className="text-center text-xs text-red-600">
                <div className="text-base font-semibold">{owner.redTags}</div>
                {t('fiveS.ownerCard.tags', { count: owner.redTags })}
              </div>
              {showAuditControls && (
                <div className="text-center text-xs text-blue-500">
                  <div className="text-base font-semibold">{owner.auditDue}</div>
                  {t('fiveS.ownerCard.due', { count: owner.auditDue })}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      )}

      {show('areas') && (
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            {t('fiveS.ui.redTagRegister')}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs text-gray-500">
              {t('fiveS.ui.openOfTotal', { open: openRedTagItems.length, total: redTagRegister.length })}
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={downloadRedTagRegisterCsv}
              disabled={!redTagRegister.length}
              type="button"
            >
              {t('fiveS.ui.exportRedTags')}
            </Button>
          </div>
        </div>
        <div className={scrollArea} tabIndex={0}>
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3">{t('fiveS.ui.colArea')}</th>
                <th className="px-4 py-3">{t('fiveS.ui.colItem')}</th>
                <th className="px-4 py-3">{t('fiveS.ui.owner')}</th>
                <th className="px-4 py-3">{t('fiveS.ui.colStatus')}</th>
                <th className="px-4 py-3">{t('fiveS.ui.colDue')}</th>
                <th className="px-4 py-3">{t('fiveS.ui.colDisposition')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {redTagRegister.slice(0, 8).map(({ zone, redTag }) => (
                <tr key={redTag.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-left font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300"
                      onClick={() => {
                        setSelectedZoneId(zone.id);
                        setSelectedObjectId('');
                      }}
                    >
                      {zone.code} - {zone.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-100">{redTag.title}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {redTag.ownerName || zone.ownerName || t('fiveS.ui.unassigned')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        isOpenRedTag(redTag)
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                          : 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300'
                      }`}
                    >
                      {redTag.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{redTag.dueDate || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{redTag.disposition || '-'}</td>
                </tr>
              ))}
              {!redTagRegister.length && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={6}>
                    {t('fiveS.inspector.noRedTagItems')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {redTagRegister.length > 8 && (
          <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700">
            {t('fiveS.inspector.firstRedTags')}
          </div>
        )}
      </div>
      )}

      {/*
        The spaghetti diagrams, and what they cost in metres.

        The total is what gets quoted at a review; the longest leg is what
        gets fixed, because eighty metres made of one long walk is a
        different problem from eighty made of sixteen short ones — and only
        the first is worth a trolley.
      */}
      {show('map') && Boolean((plan.routes ?? []).length) && (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {t('fiveS.routeRegister')}
            </div>
            <span className="text-xs text-gray-500">
              {t('fiveS.routeTotal', {
                length: formatLength(
                  (plan.routes ?? []).reduce(
                    (total, route) => total + routeLength(route, metresPerUnit),
                    0,
                  ),
                ),
              })}
            </span>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {(plan.routes ?? []).map((route) => {
              const legs = routeLegs(route, metresPerUnit);
              const longest = legs.reduce(
                (worst, leg) => (leg.metres > worst ? leg.metres : worst),
                0,
              );

              return (
                <li key={route.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: route.colour }}
                    aria-hidden="true"
                  />
                  <input
                    className="min-w-[8rem] flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-gray-900 hover:border-gray-300 focus:border-gray-400 dark:text-white dark:hover:border-gray-600"
                    aria-label={t('fiveS.routeNameOf', { name: route.name })}
                    value={route.name}
                    onChange={(event) => renameRoute(route.id, event.target.value)}
                  />
                  <span className="tabular-nums text-sm text-gray-700 dark:text-gray-200">
                    {formatLength(routeLength(route, metresPerUnit))}
                  </span>
                  <span className="tabular-nums text-xs text-gray-500">
                    {t('fiveS.routeLongestLeg', { length: formatLength(longest) })}
                  </span>
                  <button
                    type="button"
                    className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 dark:border-gray-600 dark:text-gray-300"
                    aria-label={t('fiveS.routeRemove', { name: route.name })}
                    onClick={() => removeRoute(route.id)}
                  >
                    {t('common.delete')}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/*
        The rooms, and what is happening in each. This is the level a plant
        manager walks and talks in — "how is goods-in doing" — and it could
        not be asked at all until the plan had rooms to ask it of.
      */}
      {show('map') && Boolean(rooms.length) && (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
              <MapIcon className="h-4 w-4" />
              {t('fiveS.roomRegister')}
            </div>
            <span className="text-xs text-gray-500">
              {t('fiveS.roomRegisterCount', { count: rooms.length })}
            </span>
          </div>
          <div className={scrollArea} tabIndex={0}>
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3">{t('fiveS.room')}</th>
                  <th className="px-4 py-3">{t('fiveS.roomFloor')}</th>
                  <th className="px-4 py-3">{t('fiveS.roomMapped')}</th>
                  <th className="px-4 py-3">{t('fiveS.roomAreas')}</th>
                  {showAuditControls && <th className="px-4 py-3">{t('fiveS.roomScore')}</th>}
                  <th className="px-4 py-3">{t('fiveS.roomTags')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {roomSummaries.map((summary) => (
                  <tr key={summary.key} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {summary.name || (
                        <span className="text-gray-400 dark:text-gray-500">{t('fiveS.roomUnnamed')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                      {formatArea(summary.area)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                      {summary.coverage === null ? '-' : `${Math.round(summary.coverage * 100)}%`}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                      {summary.zones.length}
                      {summary.unowned > 0 && (
                        <span className="ml-1 text-amber-700 dark:text-amber-400">
                          {t('fiveS.roomUnowned', { count: summary.unowned })}
                        </span>
                      )}
                    </td>
                    {showAuditControls && (
                      <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                        {summary.averageScore === null
                          ? t('fiveS.roomNeverAudited')
                          : `${Math.round(summary.averageScore)}%`}
                      </td>
                    )}
                    <td className="px-4 py-3 tabular-nums text-gray-600 dark:text-gray-300">
                      {summary.openRedTags}
                      {summary.tagDensity !== null && summary.openRedTags > 0 && (
                        <span className="ml-1 text-gray-400 dark:text-gray-500">
                          {t('fiveS.roomPerHundred', { density: summary.tagDensity.toFixed(1) })}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {/*
                  Areas in no room at all, said out loud rather than dropped
                  from every total: either the walls round them have not been
                  drawn, or they are somewhere nobody has accounted for.
                */}
                {Boolean(strayZones.length) && (
                  <tr className="bg-amber-50/40 dark:bg-amber-950/10">
                    <td className="px-4 py-3 text-amber-800 dark:text-amber-300" colSpan={showAuditControls ? 6 : 5}>
                      {t('fiveS.roomStrayZones', {
                        count: strayZones.length,
                        names: strayZones.map((zone) => zone.code).join(', '),
                      })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {show('areas') && (
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <ListChecks className="h-4 w-4" />
            {t('fiveS.ui.areaRegister')}
          </div>
          <span className="text-xs text-gray-500">
            {t('fiveS.ui.areasOfTotal', { shown: filteredZones.length, total: plan.zones.length })}
          </span>
        </div>
        <div className={scrollArea} tabIndex={0}>
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3">{t('fiveS.ui.colArea')}</th>
                <th className="px-4 py-3">{t('fiveS.ui.owner')}</th>
                <th className="px-4 py-3">{t('fiveS.ui.stage')}</th>
                {showAuditControls && <th className="px-4 py-3">{t('fiveS.ui.colScore')}</th>}
                {showAuditControls && <th className="px-4 py-3">{t('fiveS.ui.colAuditDue')}</th>}
                <th className="px-4 py-3">{t('fiveS.ui.redTags')}</th>
                <th className="px-4 py-3">{t('fiveS.ui.colCleaned')}</th>
                <th className="px-4 py-3">{t('fiveS.ui.colNextAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredZones.map((zone) => {
                const gaps = getZoneActionItems(zone, showAuditControls);

                return (
                  <tr key={zone.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-left font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300"
                        onClick={() => {
                          setSelectedZoneId(zone.id);
                          setSelectedObjectId('');
                        }}
                      >
                        {zone.code} - {zone.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{zone.ownerName || t('fiveS.ui.unassigned')}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t(`fiveS.stage.${stageKeys[zone.stage]}`)}</td>
                    {showAuditControls && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {zone.lastAuditScore === undefined ? '-' : `${zone.lastAuditScore}%`}
                      </td>
                    )}
                    {showAuditControls && (
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {getAuditDueDate(zone) || t('fiveS.task.now')}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{getRedTagCount(zone)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{zone.lastCleanedAt || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {nextActionText(gaps)}
                    </td>
                  </tr>
                );
              })}
              {!filteredZones.length && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500" colSpan={showAuditControls ? 8 : 6}>
                    {t('fiveS.inspector.noMatchingAreas')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </>
  );
};

export default FloorPlanAreaTables;
