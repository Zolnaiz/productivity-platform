/**
 * 5S records behind OperationsService: floor plan (with versions and merge of concurrent edits), red tags,
 * guideline registers and zone state. A plain class built by OperationsService with the shared OrganizationScope,
 * so the service stays a thin facade; see DECISIONS.md (file split).
 */
import { Repository } from 'typeorm';
import { FiveSLayout } from './entities/five-s-layout.entity';
import { FiveSGuideline } from './entities/five-s-guideline.entity';
import { FiveSLayoutVersion } from './entities/five-s-layout-version.entity';
import { defaultGuidelineContent } from './five-s-guideline-content';
import { mergeFloorFacts } from './layout-merge';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { todayIn } from './task-completion';
import { OrganizationScope } from './organization-scope';

type CurrentUser = {
  id?: string;
  role?: string;
  organizationId?: string;
};

/**
 * The 5S records: an organization's floor plans with their zones, red tags and
 * cleaning dates, the versions kept of each plan, and the 5S guideline and the
 * registers kept against it.
 *
 * A plain class rather than a Nest provider: OperationsService builds it from
 * the repositories it already has and calls it, so the routes and everything
 * that constructs OperationsService stay as they were. The audit and task code
 * left in OperationsService uses `layoutHolding` and `keepLayoutVersion`.
 */
export class FiveSRecords {
  constructor(
    private readonly fiveSLayouts: Repository<FiveSLayout>,
    private readonly layoutVersions: Repository<FiveSLayoutVersion>,
    private readonly guidelines: Repository<FiveSGuideline>,
    private readonly scope: OrganizationScope,
  ) {}

  /**
   * The organization's 5S register: its standard and what has been filled in.
   *
   * An organization that has never had one gets an empty register rather than
   * a refusal — nothing has gone wrong, the programme simply has not started.
   */
  async findFiveSGuideline(user: CurrentUser) {
    const where = this.scope.organizationWhere(user);
    const existing = await this.guidelines.findOne({ where });

    if (!existing) {
      return this.guidelines.create({
        ...where,
        content: defaultGuidelineContent as unknown as Record<string, unknown>,
        records: {},
      });
    }

    /*
      A standard to start from rather than a blank page. The default is one
      customer's 5S standard written down as data — an organization that has
      not edited theirs is better served by a sensible one they can change
      than by nothing at all, which is what the page would otherwise show.
    */
    if (!existing.content || !Object.keys(existing.content).length) {
      existing.content = defaultGuidelineContent as unknown as Record<string, unknown>;
    }

    return existing;
  }

  /**
   * Saves what people have filled in.
   *
   * Records only. The standard is changed elsewhere and by somebody else, and
   * a register that could rewrite the standard it is kept against would let a
   * checklist tick quietly move the goalposts.
   */
  async saveFiveSGuidelineRecords(records: Record<string, unknown>, user: CurrentUser, baseUpdatedAt?: string) {
    const where = this.scope.organizationWhere(user);
    const existing = await this.guidelines.findOne({ where });

    // Two people typing into the same register used to end with the last save
    // winning all of it. A save made against an older register is refused, so
    // the client can put its change on top of the newer one instead.
    if (
      existing?.updatedAt &&
      baseUpdatedAt &&
      new Date(baseUpdatedAt).getTime() !== new Date(existing.updatedAt).getTime()
    ) {
      throw apiError(ErrorCode.RegisterChanged);
    }

    if (existing) {
      existing.records = records ?? {};

      return this.guidelines.save(existing);
    }

    return this.guidelines.save(
      this.guidelines.create({ ...where, content: {}, records: records ?? {} }),
    );
  }

  /**
   * Rewrites the standard the organization is judged against.
   *
   * Content only, and by an administrator only. The records are what people
   * fill in day to day and they are saved on a different route — a page that
   * could write both would let a checklist tick and a change of standard
   * arrive in the same request, and the last one in would win.
   */
  async saveFiveSGuidelineContent(content: Record<string, unknown>, user: CurrentUser) {
    const where = this.scope.organizationWhere(user);
    const existing = await this.guidelines.findOne({ where });

    if (existing) {
      existing.content = content ?? {};

      return this.guidelines.save(existing);
    }

    return this.guidelines.save(
      this.guidelines.create({ ...where, content: content ?? {}, records: {} }),
    );
  }

  /**
   * The organization's plan that satisfies a test, or null.
   *
   * Reading them all and looking is deliberate: an organization has a handful
   * of floors, not thousands, and a query into JSON would tie the shape of a
   * zone to the shape of a database index.
   */
  async layoutHolding(user: CurrentUser, holds: (layout: FiveSLayout) => boolean) {
    const layouts = await this.fiveSLayouts.find({ where: this.scope.organizationWhere(user) });

    return layouts.find(holds) ?? null;
  }

  /**
   * Every plan the organization has, in the order somebody would read them.
   *
   * By site, then floor, then name: a plant is walked building by building and
   * floor by floor, and a list in that order is one somebody can find their
   * way down.
   */
  async findFiveSLayouts(user: CurrentUser) {
    const layouts = await this.fiveSLayouts.find({ where: this.scope.organizationWhere(user) });

    if (layouts.length) {
      return layouts.sort(
        (a, b) =>
          (a.site || '').localeCompare(b.site || '') ||
          (a.floor || '').localeCompare(b.floor || '') ||
          (a.name || '').localeCompare(b.name || ''),
      );
    }

    // An organization with no plan gets one rather than an empty list, for
    // the same reason a new workspace gets an empty plan rather than nothing:
    // there has to be something to draw on.
    return [await this.findFiveSLayout(user)];
  }

  /**
   * Raises a red tag on one zone.
   *
   * A narrow door into the plan rather than a plan update: everything the
   * caller can say is the title and what they think should happen to the
   * item, and everything else — the id, the status, the date, the count — is
   * the server's. That is what makes it safe to give to whoever is standing
   * in front of the clutter, which is the only way red-tagging works.
   */
  async addRedTag(
    planId: string,
    zoneId: string,
    payload: { title: string; disposition?: string },
    user: CurrentUser,
  ) {
    const organizationId = this.scope.resolveOrganizationId(user);
    const layout = await this.fiveSLayouts.findOne({
      where: { id: planId, ...(organizationId ? { organizationId } : {}) },
    });

    if (!layout) {
      throw apiError(ErrorCode.ResourceNotFound, 'five-s-layout');
    }

    const zone = (layout.zones ?? []).find((candidate) => candidate.id === zoneId);

    if (!zone) {
      throw apiError(ErrorCode.ResourceNotFound, 'zone');
    }

    const redTag = {
      id: `redtag-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      title: payload.title.trim(),
      disposition: payload.disposition?.trim() ?? '',
      status: 'open',
      // Whoever raised it, so the tag can be asked about later. Names are not
      // copied: a person's name changes and the account is where it lives.
      ownerId: user?.id,
      createdAt: new Date().toISOString(),
    };

    const redTags = [...((zone.redTags as Record<string, unknown>[]) ?? []), redTag];

    layout.zones = (layout.zones ?? []).map((candidate) =>
      candidate.id === zoneId
        ? {
            ...candidate,
            redTags,
            // Kept in step here rather than left to the browser: a count that
            // disagrees with the list is the kind of wrong number this
            // application has been full of.
            redTagCount: redTags.filter(
              (tag) => !(tag as { closedAt?: string }).closedAt &&
                ['open', 'review'].includes(String((tag as { status?: string }).status)),
            ).length,
          }
        : candidate,
    );

    await this.fiveSLayouts.save(layout);

    return redTag;
  }

  /**
   * Records that an area was cleaned, today.
   *
   * The date is the server's rather than the caller's: a phone's clock is
   * whatever the phone says it is, and this date is what the audit schedule
   * and the monthly report read. Marking twice in a day writes the same date
   * twice, which is the right amount of fuss to make about it.
   */
  async markZoneCleaned(planId: string, zoneId: string, user: CurrentUser) {
    const organizationId = this.scope.resolveOrganizationId(user);
    const layout = await this.fiveSLayouts.findOne({
      where: { id: planId, ...(organizationId ? { organizationId } : {}) },
    });

    if (!layout) {
      throw apiError(ErrorCode.ResourceNotFound, 'five-s-layout');
    }

    if (!(layout.zones ?? []).some((zone) => zone.id === zoneId)) {
      throw apiError(ErrorCode.ResourceNotFound, 'zone');
    }

    const lastCleanedAt = todayIn();

    layout.zones = (layout.zones ?? []).map((zone) =>
      zone.id === zoneId ? { ...zone, lastCleanedAt } : zone,
    );

    await this.fiveSLayouts.save(layout);

    return { zoneId, lastCleanedAt };
  }

  async createFiveSLayout(payload: Partial<FiveSLayout>, user: CurrentUser) {
    const organizationId = this.scope.resolveOrganizationId(user, payload.organizationId);

    return this.fiveSLayouts.save(
      this.fiveSLayouts.create({
        name: payload.name || '5S area map',
        site: payload.site || 'Workspace',
        floor: payload.floor || '',
        backgroundImage: '',
        backgroundOpacity: 0.55,
        showGrid: true,
        snapToGrid: true,
        showDimensions: false,
        zones: [],
        objects: [],
        corners: [],
        walls: [],
        openings: [],
        roomLabels: [],
        organizationId,
      }),
    );
  }

  /**
   * Removes a plan.
   *
   * Scoped by organization in the delete itself rather than by reading the row
   * and checking, so an identifier from another organization removes nothing
   * instead of being caught by a check somebody has to remember to write.
   */
  async deleteFiveSLayout(id: string, user: CurrentUser) {
    const organizationId = this.scope.resolveOrganizationId(user);
    const result = await this.fiveSLayouts.delete({ id, ...(organizationId ? { organizationId } : {}) });

    return { id, deleted: Boolean(result.affected) };
  }

  async findFiveSLayout(user: CurrentUser, id?: string) {
    const organizationId = this.scope.resolveOrganizationId(user);
    const where = organizationId ? { organizationId } : {};
    // An id names one plan; without one this is still "the organization's
    // plan", which is what every caller written before there were several
    // means by it.
    const layout = await this.fiveSLayouts.findOne({ where: id ? { ...where, id } : where });

    if (layout) {
      return layout;
    }

    const defaultLayout = this.fiveSLayouts.create({
      organizationId,
      name: '5S area map',
      site: 'Workspace',
      scale: '1 square = 1 meter',
      backgroundImage: '',
      backgroundOpacity: 0.55,
      showGrid: true,
      zones: [],
      objects: [],
      corners: [],
      walls: [],
      openings: [],
      roomLabels: [],
    });

    return this.fiveSLayouts.save(defaultLayout);
  }

  async upsertFiveSLayout(payload: Partial<FiveSLayout>, user: CurrentUser, id?: string, baseUpdatedAt?: string) {
    const organizationId = this.scope.resolveOrganizationId(user, payload.organizationId);
    const where = organizationId ? { organizationId } : {};
    const existing = await this.fiveSLayouts.findOne({ where: id ? { ...where, id } : where });
    const layoutPayload = {
      name: payload.name || '5S area map',
      site: payload.site || 'Workspace',
      floor: payload.floor ?? existing?.floor ?? '',
      scale: payload.scale || '1 square = 1 meter',
      backgroundImage: payload.backgroundImage || '',
      backgroundOpacity: payload.backgroundOpacity ?? 0.55,
      showGrid: payload.showGrid ?? true,
      snapToGrid: payload.snapToGrid ?? true,
      showDimensions: payload.showDimensions ?? false,
      zones: payload.zones || [],
      objects: payload.objects || [],
      // The wall graph. Left out of the payload until now, so a plan drawn
      // against a real backend was whole until the page was reloaded.
      corners: payload.corners || [],
      walls: payload.walls || [],
      openings: payload.openings || [],
      roomLabels: payload.roomLabels || [],
      metresPerUnit: payload.metresPerUnit ?? existing?.metresPerUnit,
      /*
        The audit layers. A client that does not send them keeps what is
        stored rather than clearing it — an older browser saving a plan must
        not silently return an organization to the default rhythm.
      */
      auditTiers: payload.auditTiers ?? existing?.auditTiers ?? [],
      // Same rule as the layers: a client that does not send them keeps what
      // is stored rather than clearing somebody's diagrams.
      routes: payload.routes ?? existing?.routes ?? [],
    };

    if (existing) {
      /*
        The plan as it stood before this save, kept once a day. An audit from
        March scored the building as it was in March; without this the score
        is attached to a drawing that no longer exists, and nobody can tell
        whether an area improved or was simply redrawn.

        Before the change rather than after, so the day's snapshot is what the
        plan looked like when the day's audits were walked.
      */
      await this.keepLayoutVersion(existing, user);
      Object.assign(existing, {
        ...layoutPayload,
        // What the floor wrote while the editor had the plan open stays.
        zones: mergeFloorFacts(existing.zones ?? [], layoutPayload.zones, baseUpdatedAt ? new Date(baseUpdatedAt) : undefined),
      });

      return this.fiveSLayouts.save(existing);
    }

    return this.fiveSLayouts.save(
      this.fiveSLayouts.create({
        ...layoutPayload,
        organizationId,
      }),
    );
  }

  /**
   * Keeps one snapshot of a plan per day.
   *
   * The editor saves on a debounce, so a version per save would be thousands
   * of copies of a drawing that changed by a pixel. A day is the grain at
   * which somebody actually asks what this looked like.
   *
   * Never throws into the save: a plan that could not be snapshotted is still
   * a plan somebody is drawing, and losing their work to keep a copy of it
   * would be an odd way to protect it.
   */
  async keepLayoutVersion(layout: FiveSLayout, user: CurrentUser, label?: string) {
    const takenOn = todayIn();

    try {
      const already = await this.layoutVersions.findOne({
        where: { layoutId: layout.id, takenOn },
      });

      if (already) {
        // A name given later wins over silence: somebody labelling today's
        // version means it, and the snapshot is the same either way.
        if (label && !already.label) {
          already.label = label;
          await this.layoutVersions.save(already);
        }

        return already;
      }

      return await this.layoutVersions.save(
        this.layoutVersions.create({
          organizationId: layout.organizationId,
          layoutId: layout.id,
          takenOn,
          takenBy: user?.id,
          label,
          // The whole plan, because the plan is one document and a version of
          // half of it would answer nothing.
          snapshot: { ...layout } as unknown as Record<string, unknown>,
        }),
      );
    } catch {
      return null;
    }
  }

  /** The days this plan was snapshotted, newest first. */
  async findLayoutVersions(layoutId: string, user: CurrentUser) {
    const layout = await this.scope.findOneScoped(this.fiveSLayouts, layoutId, user, 'five-s-layout');

    const versions = await this.layoutVersions.find({
      where: { layoutId: layout.id },
      order: { takenOn: 'DESC' },
      take: 60,
    });

    // Without the snapshots themselves: a list of sixty floor plans is
    // megabytes, and the list is read to choose one.
    return versions.map(({ snapshot: _snapshot, ...version }) => version);
  }

  /** Takes a snapshot now, under a name somebody gives it. */
  async keepLayoutVersionNow(layoutId: string, label: string | undefined, user: CurrentUser) {
    const layout = await this.scope.findOneScoped(this.fiveSLayouts, layoutId, user, 'five-s-layout');

    return this.keepLayoutVersion(layout, user, label);
  }

  /**
   * Puts a plan back the way it was on some day.
   *
   * The current plan is snapshotted first, so restoring is itself undoable —
   * somebody restoring the wrong day must not lose the drawing they had.
   */
  async restoreLayoutVersion(layoutId: string, versionId: string, user: CurrentUser) {
    const layout = await this.scope.findOneScoped(this.fiveSLayouts, layoutId, user, 'five-s-layout');
    const version = await this.layoutVersions.findOne({
      where: { id: versionId, layoutId: layout.id },
    });

    if (!version) {
      throw apiError(ErrorCode.ResourceNotFound, 'five-s-layout-version');
    }

    await this.keepLayoutVersion(layout, user);

    const snapshot = version.snapshot as Partial<FiveSLayout>;

    // Only the drawing. The row's own identity, its organization and when it
    // was created are not somebody else's to restore.
    layout.name = snapshot.name ?? layout.name;
    layout.site = snapshot.site ?? layout.site;
    layout.floor = snapshot.floor ?? layout.floor;
    layout.scale = snapshot.scale ?? layout.scale;
    layout.zones = snapshot.zones ?? [];
    layout.objects = snapshot.objects ?? [];
    layout.corners = snapshot.corners ?? [];
    layout.walls = snapshot.walls ?? [];
    layout.openings = snapshot.openings ?? [];
    layout.roomLabels = snapshot.roomLabels ?? [];
    layout.routes = snapshot.routes ?? [];
    layout.auditTiers = snapshot.auditTiers ?? [];
    layout.metresPerUnit = snapshot.metresPerUnit ?? layout.metresPerUnit;

    return this.fiveSLayouts.save(layout);
  }
}
