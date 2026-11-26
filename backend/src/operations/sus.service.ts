/**
 * SUS rounds (K7): open/close a round, save one person's ten answers, and report totals. Scoring and the
 * minimum-respondents rule are in sus.ts; individual answers are never returned.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { SusResponse, SusRound } from './entities/sus.entity';
import { summarizeSus, susScore } from './sus';

type CurrentUser = { id?: string; organizationId?: string };

/** PostgreSQL's code for a unique violation: here, a second open round. */
const UNIQUE_VIOLATION = '23505';

/**
 * The SUS questionnaire (measure K7): administrators open and close rounds,
 * everybody answers the open one, and the results are totals.
 *
 * Connected to: SusController (the routes), sus.ts (the scoring), and the
 * home page on the web and the phone, which ask `current` whether to show a
 * reminder.
 */
@Injectable()
export class SusService {
  constructor(
    @InjectRepository(SusRound) private readonly rounds: Repository<SusRound>,
    @InjectRepository(SusResponse) private readonly responses: Repository<SusResponse>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  private who(user: CurrentUser) {
    if (!user?.organizationId || !user.id) throw apiError(ErrorCode.AuthOrganizationRequired);
    return { organizationId: user.organizationId, userId: user.id };
  }

  private openRound(organizationId: string) {
    return this.rounds.findOne({ where: { organizationId, closedAt: IsNull() } });
  }

  private async roundOf(id: string, organizationId: string) {
    const round = await this.rounds.findOne({ where: { id, organizationId } });
    if (!round) throw apiError(ErrorCode.ResourceNotFound, 'Questionnaire');
    return round;
  }

  /**
   * What the person asking should see: the open round, if any, and their own
   * answers to it with the score they come to - so the form can show what
   * they said and let them change it.
   */
  async current(user: CurrentUser) {
    const { organizationId, userId } = this.who(user);
    const round = await this.openRound(organizationId);
    if (!round) return { round: null, mine: null };

    const response = await this.responses.findOne({ where: { roundId: round.id, userId } });
    return {
      round: { id: round.id, title: round.title, createdAt: round.createdAt },
      mine: response ? { answers: response.answers, score: susScore(response.answers), updatedAt: response.updatedAt } : null,
    };
  }

  /** Answering again while the round is open replaces the earlier answers. */
  async answer(roundId: string, answers: number[], user: CurrentUser) {
    const { organizationId, userId } = this.who(user);
    const round = await this.roundOf(roundId, organizationId);
    if (round.closedAt) throw apiError(ErrorCode.SurveyRoundClosed);

    const existing = await this.responses.findOne({ where: { roundId, userId } });
    const response = existing ?? this.responses.create({ organizationId, roundId, userId });
    response.answers = answers;
    const saved = await this.responses.save(response);
    return { answers: saved.answers, score: susScore(saved.answers), updatedAt: saved.updatedAt };
  }

  async open(title: string, user: CurrentUser) {
    const { organizationId, userId } = this.who(user);
    if (await this.openRound(organizationId)) throw apiError(ErrorCode.SurveyRoundOpen);

    try {
      return await this.rounds.save(this.rounds.create({ organizationId, title: title.trim(), openedBy: userId }));
    } catch (error) {
      // Two administrators at once: the database let one round through.
      if ((error as { code?: string })?.code === UNIQUE_VIOLATION) throw apiError(ErrorCode.SurveyRoundOpen);
      throw error;
    }
  }

  /** Closing a closed round changes nothing; the first close is the one kept. */
  async close(id: string, user: CurrentUser) {
    const { organizationId } = this.who(user);
    const round = await this.roundOf(id, organizationId);
    if (!round.closedAt) {
      round.closedAt = new Date();
      await this.rounds.save(round);
    }
    return round;
  }

  /** Every round, newest first, each with what it came to. */
  async list(user: CurrentUser) {
    const { organizationId } = this.who(user);
    const [rounds, members] = await Promise.all([
      this.rounds.find({ where: { organizationId }, order: { createdAt: 'DESC' }, take: 50 }),
      this.memberCount(organizationId),
    ]);
    return Promise.all(rounds.map(async (round) => ({ ...this.roundView(round), summary: await this.summaryOf(round, members) })));
  }

  async results(id: string, user: CurrentUser) {
    const { organizationId } = this.who(user);
    const round = await this.roundOf(id, organizationId);
    return { ...this.roundView(round), summary: await this.summaryOf(round, await this.memberCount(organizationId)) };
  }

  private roundView(round: SusRound) {
    return { id: round.id, title: round.title, createdAt: round.createdAt, closedAt: round.closedAt ?? null };
  }

  private async summaryOf(round: SusRound, members: number) {
    const answers = await this.responses.find({ where: { roundId: round.id }, select: { id: true, answers: true } });
    return summarizeSus(
      answers.map((response) => response.answers),
      members,
    );
  }

  /** The people who could have answered: the organization's active accounts, now. */
  private memberCount(organizationId: string) {
    return this.users.count({ where: { organizationId, isActive: true } });
  }
}
