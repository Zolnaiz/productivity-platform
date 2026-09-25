import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';

/**
 * A month that has been closed, and the records it was closed on.
 *
 * A monthly report counted from live tables is a different report every time
 * it is opened: a task reopened in May drops out of March, a work log edited
 * in June changes March's hours. A report somebody has signed off, handed to
 * the director or used in a performance conversation has to say the same
 * thing when it is read a year later — that is what an archive is.
 *
 * The records are stored rather than the finished report, so the stored month
 * is read by the same rules as a live one and each person still sees only
 * their own part of it. Reopening soft-deletes the row, so a month closed,
 * reopened and closed again keeps every version anybody was shown.
 */
@Entity('monthly_report_closes')
@Index(['organizationId'])
export class MonthlyReportClose extends BaseEntity {
  @Column({ name: 'organization_id', nullable: true })
  organizationId?: string;

  /** The month, as YYYY-MM. */
  @Column({ type: 'varchar', length: 7 })
  period: string;

  /** Who closed it. Absent when the scheduled close did. */
  @Column({ name: 'closed_by', nullable: true })
  closedBy?: string;

  /** The month's records as they stood when it was closed. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  records: Record<string, unknown>;
}
