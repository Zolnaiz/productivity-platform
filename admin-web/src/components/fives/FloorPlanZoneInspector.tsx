/**
 * Side panel for the selected zone: owner, stage, audit tiers, red tags, holding area, history. Split from
 * FiveSFloorPlanSetup.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  ListChecks,
  MousePointer2,
  Plus,
  Trash2,
  UserCheck,
} from 'lucide-react';
import Button from '../common/Button';
import PhotoEvidence from '../common/PhotoEvidence';
import ZoneHistory from './ZoneHistory';
import AuditTiers from './AuditTiers';
import AuditTierSettings from './AuditTierSettings';
import FloorPlanVersions from './FloorPlanVersions';
import HoldingArea from './HoldingArea';
import { fieldClass, zoneColorPresets } from './floorPlanPresets';
import { PlanUpdate, ZonePlace } from './floorPlanEditorTypes';
import { getAuditDueDate } from './auditSchedule';
import { getRedTagCount, getStageGate, redTagStatusOptions, stageKeys, stageOrder } from './floorPlanRules';
import { CANVAS_HEIGHT, CANVAS_WIDTH, clamp } from './floorPlanGeometry';
import { formatArea, toMetres, toUnits } from './floorPlanScale';
import { Department } from '../../types/people.types';
import { FiveSLayoutPlan, FiveSRedTag, FiveSStage, FiveSZone } from '../../types/fiveS.types';
import { TeamUser, memberName } from '../../types/people.types';

export interface FloorPlanZoneInspectorProps {
  addSelectedZoneRedTag: () => void;
  advanceSelectedZoneStage: () => void;
  createSelectedZoneTask: () => void | Promise<void>;
  decideHeldItem: (zoneId: string, redTagId: string, status: FiveSRedTag['status']) => void;
  deleteSelectedZone: () => void;
  deleteSelectedZoneRedTag: (redTagId: string) => void;
  departments: Department[];
  duplicateSelectedZone: () => void;
  handleOwnerChange: (ownerId: string) => void;
  markSelectedZoneCleanedToday: () => void;
  metresPerUnit: number;
  plan: FiveSLayoutPlan;
  selectedStageGate: ReturnType<typeof getStageGate> | null;
  selectedZone: FiveSZone;
  selectedZonePlace: ZonePlace | null;
  setReloadSignal: React.Dispatch<React.SetStateAction<number>>;
  setSelectedZoneId: (zoneId: string) => void;
  showAuditControls: boolean;
  updatePlan: PlanUpdate;
  updateSelectedZoneRedTag: (redTagId: string, patch: Partial<FiveSRedTag>) => void;
  updateZone: (zoneId: string, patch: Partial<FiveSZone>, options?: { skipHistory?: boolean }) => void;
  useSelectedZoneForAudit: () => void;
  users: TeamUser[];
}

/**
 * The right-hand panel while an area is selected: what it is and who owns
 * it, its 5S stage and the gate to the next, its standard and photographs,
 * red tags and the holding area, audits and history, and the work it raises.
 * Every change goes back through the editor (updateZone, updatePlan), which
 * keeps the undo history and saves.
 */
const FloorPlanZoneInspector: React.FC<FloorPlanZoneInspectorProps> = ({
  addSelectedZoneRedTag,
  advanceSelectedZoneStage,
  createSelectedZoneTask,
  decideHeldItem,
  deleteSelectedZone,
  deleteSelectedZoneRedTag,
  departments,
  duplicateSelectedZone,
  handleOwnerChange,
  markSelectedZoneCleanedToday,
  metresPerUnit,
  plan,
  selectedStageGate,
  selectedZone,
  selectedZonePlace,
  setReloadSignal,
  setSelectedZoneId,
  showAuditControls,
  updatePlan,
  updateSelectedZoneRedTag,
  updateZone,
  useSelectedZoneForAudit,
  users,
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <MousePointer2 className="h-4 w-4" />
            {t('fiveS.ui.selectedZone')}
          </div>
          <div className="mt-1 text-xs text-gray-500">{selectedZone.code}</div>
        </div>
        <button
          type="button"
          onClick={deleteSelectedZone}
          className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
          aria-label={t('fiveS.ui.deleteSelectedZone')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/*
        Where this area actually is. A zone used to be a rectangle
        floating in an abstract canvas: it knew nothing about the
        place it was describing, so it could not be compared with
        another zone, in this building or any other.
      */}
      {selectedZonePlace && (
        <div
          data-testid="five-s-zone-place"
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs dark:border-gray-700"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-600 dark:text-gray-300">
            <span className="font-medium">
              {selectedZonePlace.room
                ? selectedZonePlace.roomName || t('fiveS.roomUnnamed')
                : t('fiveS.zoneOutsideRooms')}
            </span>
            <span className="tabular-nums">{formatArea(selectedZonePlace.coverage.area)}</span>
            {selectedZonePlace.coverage.share !== null && (
              <span className="tabular-nums text-gray-500 dark:text-gray-400">
                {t('fiveS.zoneShare', {
                  share: Math.round(selectedZonePlace.coverage.share * 100),
                })}
              </span>
            )}
          </div>
          {selectedZonePlace.tagDensity !== null && getRedTagCount(selectedZone) > 0 && (
            <div className="mt-1 tabular-nums text-gray-500 dark:text-gray-400">
              {t('fiveS.zoneTagDensity', { density: selectedZonePlace.tagDensity.toFixed(1) })}
            </div>
          )}
          {/*
            A zone drawn across a wall is two places with one name:
            nobody can walk it as one area, audit it as one, or own
            it as one. Better said now than noticed on the day.
          */}
          {selectedZonePlace.split && (
            <div className="mt-1 flex items-start gap-1 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-3 w-3 flex-none" aria-hidden="true" />
              <span>{t('fiveS.zoneCrossesWall')}</span>
            </div>
          )}
        </div>
      )}

      <label className="block text-sm text-gray-600 dark:text-gray-400">
        {t('fiveS.inspector.zoneName')}
        <input
          className={fieldClass}
          value={selectedZone.name}
          onChange={(event) => updateZone(selectedZone.id, { name: event.target.value })}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          {t('fiveS.inspector.code')}
          <input
            className={fieldClass}
            value={selectedZone.code}
            onChange={(event) => updateZone(selectedZone.id, { code: event.target.value.toUpperCase() })}
          />
        </label>
        <div className="block text-sm text-gray-600 dark:text-gray-400">
          {t('fiveS.inspector.color')}
          <div className="mt-1 grid grid-cols-4 gap-2">
            {zoneColorPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => updateZone(selectedZone.id, { color: preset.value })}
                className={`h-9 rounded-lg border text-[10px] font-medium ${
                  selectedZone.color === preset.value
                    ? 'border-gray-900 text-gray-900 ring-2 ring-gray-900/20 dark:border-white dark:text-white'
                    : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
                }`}
                style={{ backgroundColor: `${preset.value}22` }}
              >
                {t(`fiveS.colorPreset.${preset.key}`)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          X
          <input
            className={fieldClass}
            min={0}
            max={CANVAS_WIDTH - selectedZone.width}
            type="number"
            value={Math.round(selectedZone.x)}
            onChange={(event) =>
              updateZone(selectedZone.id, {
                x: clamp(Number(event.target.value), 0, CANVAS_WIDTH - selectedZone.width),
              })
            }
          />
        </label>
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          Y
          <input
            className={fieldClass}
            min={0}
            max={CANVAS_HEIGHT - selectedZone.height}
            type="number"
            value={Math.round(selectedZone.y)}
            onChange={(event) =>
              updateZone(selectedZone.id, {
                y: clamp(Number(event.target.value), 0, CANVAS_HEIGHT - selectedZone.height),
              })
            }
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {/*
          Metres, not canvas units. `Width: 200` was two hundred of
          nothing; a person setting up an area knows it is six metres
          across and has no idea what two hundred means.
        */}
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          {t('fiveS.widthMetres')}
          <input
            className={fieldClass}
            min={0.5}
            step={0.1}
            type="number"
            value={Number(toMetres(selectedZone.width, metresPerUnit).toFixed(1))}
            onChange={(event) =>
              updateZone(selectedZone.id, {
                width: clamp(
                  toUnits(Number(event.target.value), metresPerUnit),
                  80,
                  CANVAS_WIDTH - selectedZone.x,
                ),
              })
            }
          />
        </label>
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          {t('fiveS.heightMetres')}
          <input
            className={fieldClass}
            min={0.5}
            step={0.1}
            type="number"
            value={Number(toMetres(selectedZone.height, metresPerUnit).toFixed(1))}
            onChange={(event) =>
              updateZone(selectedZone.id, {
                height: clamp(
                  toUnits(Number(event.target.value), metresPerUnit),
                  72,
                  CANVAS_HEIGHT - selectedZone.y,
                ),
              })
            }
          />
        </label>
      </div>
      <label className="block text-sm text-gray-600 dark:text-gray-400">
        {t('fiveS.ui.responsibleOwner')}
        <select className={fieldClass} value={selectedZone.ownerId || ''} onChange={(event) => handleOwnerChange(event.target.value)}>
          <option value="">{t('fiveS.ui.unassigned')}</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {memberName(user)} / {user.position}
            </option>
          ))}
        </select>
      </label>
      {/*
        Who still answers for this area when that person moves on. A
        name on a zone is who to ask today; a department is what the
        responsibility survives in.
      */}
      <label className="block text-sm text-gray-600 dark:text-gray-400">
        {t('fiveS.ui.responsibleDepartment')}
        <select
          className={fieldClass}
          value={selectedZone.departmentId || ''}
          onChange={(event) =>
            updateZone(selectedZone.id, { departmentId: event.target.value || undefined })
          }
        >
          <option value="">{t('fiveS.ui.unassigned')}</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>
      <div className={`grid gap-3 ${showAuditControls ? 'sm:grid-cols-2' : ''}`}>
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          5S stage
          <select
            className={fieldClass}
            value={selectedZone.stage}
            onChange={(event) => updateZone(selectedZone.id, { stage: event.target.value as FiveSStage })}
          >
            {stageOrder.map((stage) => (
              <option key={stage} value={stage}>
                {t(`fiveS.stage.${stageKeys[stage]}`)}
              </option>
            ))}
          </select>
        </label>
        {showAuditControls && (
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            {t('fiveS.inspector.auditCycle')}
            <select
              className={fieldClass}
              value={selectedZone.auditFrequency}
              onChange={(event) =>
                updateZone(selectedZone.id, {
                  auditFrequency: event.target.value as FiveSZone['auditFrequency'],
                })
              }
            >
              <option value="daily">{t('fiveS.ui.daily')}</option>
              <option value="weekly">{t('fiveS.ui.weekly')}</option>
              <option value="monthly">{t('fiveS.ui.monthly')}</option>
            </select>
          </label>
        )}
      </div>
      {selectedStageGate && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between gap-2">
            <div className="font-medium text-gray-900 dark:text-white">{t('fiveS.ui.stageGate')}</div>
            <div className="text-xs text-gray-500">
              {t(`fiveS.stage.${stageKeys[selectedZone.stage]}`)}
              {selectedStageGate.nextStage
                ? ` → ${t(`fiveS.stage.${stageKeys[selectedStageGate.nextStage]}`)}`
                : ` ${t('fiveS.ui.stageActive')}`}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {selectedStageGate.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                <CheckCircle2
                  className={`h-4 w-4 flex-none ${item.complete ? 'text-green-700' : 'text-gray-300 dark:text-gray-600'}`}
                />
              </div>
            ))}
          </div>
          <Button
            fullWidth
            className="mt-3"
            variant="outline"
            size="sm"
            icon={ArrowRight}
            onClick={advanceSelectedZoneStage}
            disabled={!selectedStageGate.nextStage || !selectedStageGate.complete}
            type="button"
          >
            {selectedStageGate.nextStage
              ? t('fiveS.ui.advanceTo', {
                  stage: t(`fiveS.stage.${stageKeys[selectedStageGate.nextStage]}`),
                })
              : t('fiveS.ui.sustainActive')}
          </Button>
        </div>
      )}
      {showAuditControls && (
        <>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="text-gray-500 dark:text-gray-400">{t('fiveS.ui.lastAuditScore')}</div>
            <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
              {selectedZone.lastAuditScore === undefined ? '-' : `${selectedZone.lastAuditScore}%`}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {t('fiveS.inspector.nextAudit', { date: getAuditDueDate(selectedZone) || t('fiveS.inspector.dueNow') })}
            </div>
          </div>
          <label className="block text-sm text-gray-600 dark:text-gray-400">
            {t('fiveS.inspector.lastAuditDate')}
            <input
              className={fieldClass}
              type="date"
              value={selectedZone.lastAuditAt || ''}
              onChange={(event) => updateZone(selectedZone.id, { lastAuditAt: event.target.value })}
            />
          </label>
        </>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          {t('fiveS.inspector.openRedTags')}
          <input
            className={fieldClass}
            type="number"
            value={getRedTagCount(selectedZone)}
            readOnly
          />
        </label>
        <label className="block text-sm text-gray-600 dark:text-gray-400">
          {t('fiveS.inspector.lastCleaned')}
          <input
            className={fieldClass}
            type="date"
            value={selectedZone.lastCleanedAt || ''}
            onChange={(event) => updateZone(selectedZone.id, { lastCleanedAt: event.target.value })}
          />
        </label>
      </div>
      <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            {t('fiveS.ui.redTagRegister')}
          </div>
          <Button variant="outline" size="sm" icon={Plus} onClick={addSelectedZoneRedTag} type="button">
            {t('fiveS.ui.addTag')}
          </Button>
        </div>
        <div className="space-y-3">
          {(selectedZone.redTags || []).map((redTag) => (
            <div key={redTag.id} className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="text-xs text-gray-500">
                  {t('fiveS.inspector.tagRaised', {
                    owner: redTag.ownerName || selectedZone.ownerName || t('fiveS.ui.unassigned'),
                    date: redTag.createdAt ? redTag.createdAt.slice(0, 10) : '-',
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => deleteSelectedZoneRedTag(redTag.id)}
                  className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30"
                  aria-label={t('fiveS.ui.deleteRedTag')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <label className="block text-xs text-gray-600 dark:text-gray-400">
                {t('fiveS.inspector.item')}
                <input
                  className={fieldClass}
                  value={redTag.title}
                  onChange={(event) => updateSelectedZoneRedTag(redTag.id, { title: event.target.value })}
                />
              </label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="block text-xs text-gray-600 dark:text-gray-400">
                  {t('fiveS.inspector.status')}
                  <select
                    className={fieldClass}
                    value={redTag.status}
                    onChange={(event) =>
                      updateSelectedZoneRedTag(redTag.id, { status: event.target.value as FiveSRedTag['status'] })
                    }
                  >
                    {redTagStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(`fiveS.redTagStatus.${option.key}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-gray-600 dark:text-gray-400">
                  {t('fiveS.inspector.dueDate')}
                  <input
                    className={fieldClass}
                    type="date"
                    value={redTag.dueDate || ''}
                    onChange={(event) => updateSelectedZoneRedTag(redTag.id, { dueDate: event.target.value })}
                  />
                </label>
              </div>
              <label className="mt-2 block text-xs text-gray-600 dark:text-gray-400">
                {t('fiveS.inspector.disposition')}
                <input
                  className={fieldClass}
                  value={redTag.disposition}
                  onChange={(event) => updateSelectedZoneRedTag(redTag.id, { disposition: event.target.value })}
                />
              </label>
              <div className="mt-3">
                {/* A red tag is a claim until there is a picture of
                    the item, and a fix is unproven until the after
                    shot sits beside the before one. */}
                <PhotoEvidence
                  ownerType="five_s_red_tag"
                  ownerId={redTag.id}
                  kinds={['before', 'after']}
                  label={t('photos.evidenceLabel')}
                />
              </div>
              {redTag.closedAt && <div className="mt-2 text-xs text-gray-500">{t('fiveS.inspector.closed', { date: redTag.closedAt })}</div>}
            </div>
          ))}
          {!selectedZone.redTags?.length && (
            <div className="rounded-md border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500 dark:border-gray-700">
              {t('fiveS.inspector.noRedTagItems')}
            </div>
          )}
        </div>
      </div>
      <label className="block text-sm text-gray-600 dark:text-gray-400">
        {t('fiveS.inspector.contents')}
        <textarea
          className={`${fieldClass} min-h-[72px]`}
          value={selectedZone.contents}
          onChange={(event) => updateZone(selectedZone.id, { contents: event.target.value })}
        />
      </label>
      {/* How the area has actually been scoring. Audit runs reference
          their zone, so this history exists for the first time. */}
      <ZoneHistory zone={selectedZone} />

      <AuditTiers zone={selectedZone} tiers={plan.auditTiers} />

      {/*
        And what those layers are. They were read from the plan and
        could not be changed, so every organization ran on the
        defaults whatever its own practice was.
      */}
      <AuditTierSettings
        tiers={plan.auditTiers}
        onChange={(auditTiers) => updatePlan((current) => ({ ...current, auditTiers }))}
      />

      {/*
        And what the plan looked like before today. A score three
        months old means nothing against a drawing that has changed
        since.
      */}
      <FloorPlanVersions
        planId={plan.id}
        editable
        onRestored={() => setReloadSignal((value) => value + 1)}
      />

      <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <HoldingArea
          zones={plan.zones}
          onDecide={decideHeldItem}
          onSelectZone={setSelectedZoneId}
        />
      </div>

      <div className="space-y-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">{t('photos.standard')}</div>
        {/* A written standard describes the state; the photograph is
            what an auditor actually compares the area against. */}
        <PhotoEvidence
          ownerType="five_s_zone"
          ownerId={selectedZone.id}
          kinds={['standard']}
          label={t('photos.standard')}
        />
      </div>
      <label className="block text-sm text-gray-600 dark:text-gray-400">
        {t('fiveS.ui.standardText')}
        <textarea
          className={`${fieldClass} min-h-[72px]`}
          value={selectedZone.standard}
          onChange={(event) => updateZone(selectedZone.id, { standard: event.target.value })}
        />
      </label>
      <label className="block text-sm text-gray-600 dark:text-gray-400">
        {t('fiveS.inspector.labelNote')}
        <input
          className={fieldClass}
          value={selectedZone.labelText}
          onChange={(event) => updateZone(selectedZone.id, { labelText: event.target.value })}
        />
      </label>
      <Button fullWidth variant="outline" icon={ListChecks} onClick={createSelectedZoneTask} type="button">
        {t('fiveS.ui.createSetupTask')}
      </Button>
      <Button
        fullWidth
        variant="outline"
        icon={CheckCircle2}
        onClick={markSelectedZoneCleanedToday}
        type="button"
      >
        {t('fiveS.ui.markCleaned')}
      </Button>
      <Button fullWidth variant="outline" icon={Copy} onClick={duplicateSelectedZone} type="button">
        {t('fiveS.ui.duplicateZone')}
      </Button>
      {showAuditControls && (
        <Button fullWidth variant="outline" icon={UserCheck} onClick={useSelectedZoneForAudit} type="button">
          {t('fiveS.ui.useAsAuditLocation')}
        </Button>
      )}
    </div>
  );
};

export default FloorPlanZoneInspector;
