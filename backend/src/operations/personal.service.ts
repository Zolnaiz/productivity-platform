import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { badgesFor } from './badges';
import { CreateFocusSessionDto } from './dto/focus.dto';
import { AuditRun } from './entities/audit-run.entity';
import { FocusSession } from './entities/focus-session.entity';
import { Idea } from './entities/idea.entity';
import { WeeklyCheckin } from './entities/weekly-checkin.entity';
import { WorkLog } from './entities/work-log.entity';
import { todayIn } from './task-completion';

type CurrentUser = { id?: string; organizationId?: string };

/** A person's own focus sessions and the badges their records earn. */
@Injectable()
export class PersonalService {
  constructor(
    @InjectRepository(FocusSession) private readonly sessions: Repository<FocusSession>,
    @InjectRepository(WorkLog) private readonly workLogs: Repository<WorkLog>,
    @InjectRepository(AuditRun) private readonly auditRuns: Repository<AuditRun>,
    @InjectRepository(WeeklyCheckin) private readonly checkins: Repository<WeeklyCheckin>,
    @InjectRepository(Idea) private readonly ideas: Repository<Idea>,
  ) {}

  private owner(user: CurrentUser) {
    if (!user?.organizationId || !user.id) throw apiError(ErrorCode.AuthOrganizationRequired);
    return { organizationId: user.organizationId, userId: user.id };
  }

  async focusSessions(user: CurrentUser) {
    const sessions = await this.sessions.find({ where: this.owner(user), order: { sessionDate: 'DESC', createdAt: 'DESC' }, take: 500 });
    return sessions.map(this.toClient);
  }

  async addFocusSession(payload: CreateFocusSessionDto, user: CurrentUser) {
    const saved = await this.sessions.save(
      this.sessions.create({
        ...this.owner(user),
        title: payload.title.trim(),
        minutes: payload.minutes,
        sessionDate: payload.date ?? todayIn(),
      }),
    );
    return this.toClient(saved);
  }

  async badges(user: CurrentUser) {
    const { organizationId, userId } = this.owner(user);
    const [workLogs, auditRuns, sessions, checkins, ideas] = await Promise.all([
      this.workLogs.count({ where: { organizationId, userId } }),
      this.auditRuns.count({ where: { organizationId, auditorId: userId, status: In(['submitted', 'completed']) } }),
      this.sessions.find({ where: { organizationId, userId }, select: { sessionDate: true } as never }),
      this.checkins.find({ where: { organizationId, userId }, select: { week: true } as never }),
      this.ideas.count({ where: { organizationId, authorId: userId, status: In(['approved', 'done']) as never } }),
    ]);
    const focusByDay: Record<string, number> = {};
    for (const session of sessions) {
      const day = String(session.sessionDate).slice(0, 10);
      focusByDay[day] = (focusByDay[day] ?? 0) + 1;
    }
    return badgesFor({
      workLogs,
      auditRuns,
      focusByDay,
      checkinWeeks: new Set(checkins.map((checkin) => String(checkin.week).slice(0, 10))).size,
      ideasTakenUp: ideas,
    });
  }

  private toClient = (session: FocusSession) => ({
    id: session.id,
    title: session.title,
    minutes: Number(session.minutes),
    date: String(session.sessionDate).slice(0, 10),
  });
}
