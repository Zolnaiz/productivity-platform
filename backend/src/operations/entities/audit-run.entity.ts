import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

@Entity('audit_runs')
@Index(['organizationId'])
@Index(['templateId'])
@Index(['auditorId'])
export class AuditRun extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  @Column({ type: 'uuid', name: 'template_id' })
  templateId: string;

  @Column({ name: 'auditor_id', nullable: true })
  auditorId?: string;

  @Column({ type: 'uuid', name: 'project_id', nullable: true })
  projectId?: string;

  /**
   * The 5S zone this run audited, as an id from the organization's floor plan.
   *
   * `location` was free text, so a score could never find its way back to the
   * map. With a real reference, submitting a run updates the zone's condition
   * and the floor plan becomes a live status board rather than a drawing.
   */
  @Column({ name: 'zone_id', nullable: true })
  zoneId?: string;

  /**
   * Which layer of the audit this was — operator, supervisor, manager.
   *
   * Layered audits run the same area on different clocks, so a run has to say
   * which clock it just reset. Absent for an unlayered audit.
   */
  @Column({ type: 'int', nullable: true })
  tier?: number;

  /** Free-text place, for audits that are not tied to a mapped zone. */
  @Column({ nullable: true })
  location?: string;

  /**
   * The floor plan as it stood when this was walked.
   *
   * A score is only as readable as the drawing behind it: a March result
   * against a June plan cannot say whether an area improved or was redrawn.
   * The date is kept beside the id because the date is what a reader wants
   * and a snapshot's date never changes.
   */
  @Column({ name: 'layout_version_id', nullable: true })
  layoutVersionId?: string;

  @Column({ name: 'layout_version_on', type: 'date', nullable: true })
  layoutVersionOn?: string;

  @Column({ type: 'jsonb', default: [] })
  answers: Array<{
    questionId: string;
    value: string | number | boolean;
    note?: string;
  }>;

  @Column({ type: 'numeric', precision: 8, scale: 2, default: 0 })
  score: number;

  @Column({ default: 'draft' })
  status: string;
}
