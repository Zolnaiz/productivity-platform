import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { SaveCheckinDto } from './dto/checkins.dto';
import { WeeklyCheckin } from './entities/weekly-checkin.entity';

type CurrentUser = { id?: string; organizationId?: string };

/** The Monday of the week a date falls in, as a calendar day. */
export const mondayOf = (day: string) => {
  const [year, month, date] = day.split('-').map(Number);
  const at = new Date(Date.UTC(year, month - 1, date));
  // getUTCDay: Sunday 0 ... Saturday 6. Monday starts the week, as it does in Mongolia.
  const back = (at.getUTCDay() + 6) % 7;
  at.setUTCDate(at.getUTCDate() - back);
  return at.toISOString().slice(0, 10);
};

/**
 * Weekly check-ins: each person's own, and - for somebody who runs the work -
 * the whole team's for a week, problems included.
 */
@Injectable()
export class CheckinsService {
  constructor(@InjectRepository(WeeklyCheckin) private readonly checkins: Repository<WeeklyCheckin>) {}

  private who(user: CurrentUser) {
    if (!user?.organizationId || !user.id) throw apiError(ErrorCode.AuthOrganizationRequired);
    return { organizationId: user.organizationId, userId: user.id };
  }

  async findMine(week: string, user: CurrentUser) {
    const { userId } = this.who(user);
    return (await this.checkins.findOne({ where: { userId, week: mondayOf(week) } })) ?? null;
  }

  /** Written again in the same week, it is the same check-in, updated. */
  async saveMine(payload: SaveCheckinDto, user: CurrentUser) {
    const { organizationId, userId } = this.who(user);
    const week = mondayOf(payload.week);
    const existing = await this.checkins.findOne({ where: { userId, week } });
    const checkin =
      existing ?? this.checkins.create({ organizationId, userId, week, progress: '', plans: '', problems: '' });

    if (payload.progress !== undefined) checkin.progress = payload.progress.trim();
    if (payload.plans !== undefined) checkin.plans = payload.plans.trim();
    if (payload.problems !== undefined) checkin.problems = payload.problems.trim();

    return this.checkins.save(checkin);
  }

  /** Everybody's for the week, in the organization of whoever asks. */
  findTeam(week: string, user: CurrentUser) {
    const { organizationId } = this.who(user);
    return this.checkins.find({ where: { organizationId, week: mondayOf(week) }, order: { updatedAt: 'DESC' } });
  }
}
