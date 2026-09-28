import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { Idea, IdeaStatus } from './entities/idea.entity';
import { MonthlySummary } from './entities/monthly-summary.entity';
import { WeeklyCheckin } from './entities/weekly-checkin.entity';
import { MonthlyReport } from './monthly-report';
import { ReportArchiveService } from './report-archive.service';

type CurrentUser = { id?: string; role?: string; organizationId?: string };

export type SummaryLanguage = 'mn' | 'en';

/** What the month was, as figures, with nobody named: all that leaves the building. */
export interface MonthFacts {
  period: string;
  people: number;
  tasks: { planned: number; plannedDone: number; completionRate: number; finished: number; finishedTitles: string[] };
  hours: number;
  workLogs: number;
  audits: number;
  projects: Array<{ name: string; progress: number }>;
  dailyGoalCompletionRate: number;
  ideasPutInPlace: string[];
  ideasSubmitted: number;
  problemsRaised: string[];
}

export const monthFacts = (report: MonthlyReport, ideas: Idea[], checkins: WeeklyCheckin[]): MonthFacts => {
  const inMonth = (value?: Date | string | null) => Boolean(value) && new Date(value as string).toISOString().slice(0, 7) === report.period;
  return {
    period: report.period,
    people: report.people.length,
    tasks: {
      planned: report.totals.plannedTasks,
      plannedDone: report.totals.plannedCompleted,
      completionRate: report.kpis.completionRate,
      finished: report.totals.completedTasks,
      finishedTitles: report.completedTasks.slice(0, 15).map((task) => task.title),
    },
    hours: report.totals.totalHours,
    workLogs: report.totals.workLogs,
    audits: report.totals.auditRuns,
    projects: report.projects.slice(0, 10).map((project) => ({
      name: project.name,
      progress: Number((project as { progress?: number }).progress ?? 0),
    })),
    dailyGoalCompletionRate: report.kpis.dailyGoalCompletionRate,
    ideasPutInPlace: ideas.filter((idea) => idea.status === IdeaStatus.DONE && inMonth(idea.reviewedAt)).map((idea) => idea.title),
    ideasSubmitted: ideas.filter((idea) => inMonth(idea.createdAt)).length,
    // What people said was in their way, without saying who.
    problemsRaised: checkins
      .filter((checkin) => checkin.week.slice(0, 7) === report.period && checkin.problems.trim())
      .map((checkin) => checkin.problems.trim())
      .slice(0, 12),
  };
};

const INSTRUCTIONS: Record<SummaryLanguage, string> = {
  mn: [
    'Та Монголын байгууллагын сарын ажлын тайланд удирдлагад зориулсан товч тойм бичдэг туслах.',
    'Зөвхөн өгсөн тоо баримт дээр тулгуурла; байхгүй зүйл бүү зохио, тоог бүү өөрчил.',
    'Монгол хэлээр, албан ёсны боловч энгийн хэллэгээр 3 догол мөр бич:',
    '1) сарын гол үр дүн (ажлын гүйцэтгэл, цаг, дууссан гол ажил),',
    '2) 5S, аудит, сайжруулалтын санаа,',
    '3) ажилтнуудын дурдсан саад бэрхшээл ба дараагийн сард анхаарах 2-3 зүйл.',
    'Хүний нэр бүү дурд. Гарчиг, жагсаалтын тэмдэг бүү хэрэглэ. 180 үгээс хэтрүүлэхгүй.',
  ].join('\n'),
  en: [
    "You write the short summary at the head of an organization's monthly work report, for its managers.",
    'Use only the facts given; invent nothing and do not change any figure.',
    'Write three plain paragraphs in English:',
    '1) the month\'s main results (completion, hours, the main work finished),',
    '2) 5S, audits and improvement ideas,',
    '3) what people said was in their way, and two or three things to watch next month.',
    'Name nobody. No headings or bullet points. At most 180 words.',
  ].join('\n'),
};

/**
 * The summary at the head of a month's report: drafted by Claude from the
 * month's figures on request, then read, edited and approved by a manager.
 * Until it is approved it is a draft, and the report shows it as one.
 */
@Injectable()
export class MonthlySummaryService {
  private readonly logger = new Logger(MonthlySummaryService.name);

  constructor(
    @InjectRepository(MonthlySummary) private readonly summaries: Repository<MonthlySummary>,
    @InjectRepository(Idea) private readonly ideas: Repository<Idea>,
    @InjectRepository(WeeklyCheckin) private readonly checkins: Repository<WeeklyCheckin>,
    private readonly archive: ReportArchiveService,
    private readonly config: ConfigService,
  ) {}

  private organizationOf(user: CurrentUser) {
    if (!user?.organizationId) throw apiError(ErrorCode.AuthOrganizationRequired);
    return user.organizationId;
  }

  async find(user: CurrentUser, period: string) {
    return (await this.summaries.findOne({ where: { organizationId: this.organizationOf(user), period } })) ?? null;
  }

  private async upsert(user: CurrentUser, period: string, change: Partial<MonthlySummary>) {
    const organizationId = this.organizationOf(user);
    const existing = await this.summaries.findOne({ where: { organizationId, period } });
    const summary = existing ?? this.summaries.create({ organizationId, period, text: '', aiDrafted: false });
    Object.assign(summary, change, { updatedBy: user.id });
    return this.summaries.save(summary);
  }

  /** Writes a fresh draft with Claude. Replaces an unapproved draft; clears an approval. */
  async draft(user: CurrentUser, period: string, language: SummaryLanguage) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) throw apiError(ErrorCode.AiNotConfigured);

    const organizationId = this.organizationOf(user);
    // The manager's view of the month: drafting is a manager's act.
    const report = (await this.archive.monthlyReport(user, period)) as MonthlyReport;
    const [ideas, checkins] = await Promise.all([
      this.ideas.find({ where: { organizationId } }),
      this.checkins.find({ where: { organizationId } }),
    ]);
    const facts = monthFacts(report, ideas, checkins);

    const text = await this.askClaude(apiKey, language, facts);
    return this.upsert(user, period, { text, aiDrafted: true, approvedBy: null, approvedAt: null });
  }

  /** A manager's own words, or the draft as they changed it; approved when they say so. */
  save(user: CurrentUser, period: string, text: string, approve: boolean) {
    return this.upsert(user, period, {
      text: text.trim(),
      aiDrafted: false,
      approvedBy: approve ? user.id : null,
      approvedAt: approve ? new Date() : null,
    });
  }

  private async askClaude(apiKey: string, language: SummaryLanguage, facts: MonthFacts) {
    const model = this.config.get<string>('ANTHROPIC_MODEL') || 'claude-sonnet-5';
    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: INSTRUCTIONS[language],
          messages: [{ role: 'user', content: `The month's facts, as JSON:\n${JSON.stringify(facts, null, 2)}` }],
        }),
      });
    } catch (error) {
      this.logger.warn(`Could not reach the Claude API: ${(error as Error).message}`);
      throw apiError(ErrorCode.AiFailed);
    }
    if (!response.ok) {
      this.logger.warn(`The Claude API answered ${response.status}`);
      throw apiError(ErrorCode.AiFailed);
    }
    const body = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (body.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('\n')
      .trim();
    if (!text) throw apiError(ErrorCode.AiFailed);
    return text;
  }
}
