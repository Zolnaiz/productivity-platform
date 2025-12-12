import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Report } from '../shared/entities/report.entity';
import { Questionnaire } from '../shared/entities/questionnaire.entity';
import { Expense } from '../shared/entities/expense.entity';
import { Response } from '../shared/entities/response.entity';
import { GenerateReportDto } from './dto/generate-report.dto';
import { ReportFilterDto } from './dto/report-filter.dto';
import { ReportType, ReportStatus } from '../shared/entities/report.entity';
import { ExpenseStatus, ExpenseCategory } from '../expenses/entities/expense.entity';
import { ScoringUtils } from '../shared/utils/scoring.utils';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(Questionnaire)
    private readonly questionnaireRepository: Repository<Questionnaire>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
  ) {}

  async findAll(options: { page: number; limit: number; type?: string }) {
    const { page, limit, type } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) {
      where.type = type as ReportType;
    }

    const [reports, total] = await this.reportRepository.findAndCount({
      where,
      relations: ['generatedBy', 'organization'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['generatedBy', 'organization', 'questionnaire'],
    });

    if (!report) {
      throw new NotFoundException(`Тайлан олдсонгүй: ${id}`);
    }

    return report;
  }

  async generateReport(dto: GenerateReportDto) {
    const { type, organizationId, startDate, endDate, questionnaireId, generatedBy } = dto;

    let data: any;
    let title: string;
    let description: string;

    switch (type) {
      case ReportType.QUESTIONNAIRE:
        data = await this.generateQuestionnaireReport(questionnaireId!, organizationId, startDate, endDate);
        const questionnaire = await this.questionnaireRepository.findOne({ where: { id: questionnaireId } });
        title = `Асуулгын тайлан: ${questionnaire?.title || questionnaireId}`;
        description = `${startDate} - ${endDate} хоорондын асуулгын тайлан`;
        break;

      case ReportType.EXPENSE:
        data = await this.generateExpenseReport(organizationId, startDate, endDate);
        title = `Зардлын тайлан: ${organizationId}`;
        description = `${startDate} - ${endDate} хоорондын зардлын тайлан`;
        break;

      case ReportType.COMBINED:
        data = await this.generateCombinedReport(organizationId, startDate, endDate);
        title = `Нийт тайлан: ${organizationId}`;
        description = `${startDate} - ${endDate} хоорондын нийт тайлан`;
        break;

      default:
        throw new BadRequestException('Тайлангийн төрөл буруу байна');
    }

    const report = this.reportRepository.create({
      type,
      title,
      description,
      data,
      organizationId,
      generatedById: generatedBy,
      status: ReportStatus.COMPLETED,
      parameters: {
        startDate,
        endDate,
        organizationId,
        questionnaireId,
      },
    });

    return this.reportRepository.save(report);
  }

  async generateQuickReport(filterDto: ReportFilterDto) {
    const { organizationId, startDate, endDate, category } = filterDto;

    const [questionnaires, expenses, responses] = await Promise.all([
      this.questionnaireRepository.find({
        where: {
          organizationId,
          createdAt: Between(new Date(startDate), new Date(endDate)),
        },
        relations: ['responses'],
      }),
      this.expenseRepository.find({
        where: {
          organizationId,
          expenseDate: Between(new Date(startDate), new Date(endDate)),
          ...(category ? { category: category as ExpenseCategory } : {}),
        },
      }),
      this.responseRepository.find({
        where: {
          organizationId,
          submittedAt: Between(new Date(startDate), new Date(endDate)),
        },
      }),
    ]);

    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const avgResponseScore = responses.length > 0
      ? responses.reduce((sum, response) => sum + (response.score || 0), 0) / responses.length
      : 0;

    return {
      period: { startDate, endDate },
      summary: {
        totalQuestionnaires: questionnaires.length,
        totalResponses: responses.length,
        totalExpenses: expenses.length,
        totalExpenseAmount: totalExpenses,
        averageScore: avgResponseScore,
        completionRate: questionnaires.length > 0
          ? (responses.length / questionnaires.length) * 100
          : 0,
      },
      breakdown: {
        byExpenseCategory: this.groupExpensesByCategory(expenses),
        byQuestionnaire: questionnaires.map(q => ({
          id: q.id,
          title: q.title,
          responseCount: q.responses.length,
          averageScore: q.responses.length > 0
            ? q.responses.reduce((sum, r) => sum + (r.score || 0), 0) / q.responses.length
            : 0,
        })),
      },
    };
  }

  async getDashboardSummary() {
    const [questionnaires, expenses, responses] = await Promise.all([
      this.questionnaireRepository.find({
        where: { isActive: true },
        relations: ['responses'],
      }),
      this.expenseRepository.find(),
      this.responseRepository.find(),
    ]);

    const recentExpenses = expenses
      .sort((a, b) => b.expenseDate.getTime() - a.expenseDate.getTime())
      .slice(0, 5);

    const monthlyExpenses = this.calculateMonthlyExpenses(expenses);
    const topQuestionnaires = questionnaires
      .sort((a, b) => b.responses.length - a.responses.length)
      .slice(0, 5);

    return {
      totals: {
        questionnaires: questionnaires.length,
        expenses: expenses.length,
        responses: responses.length,
        totalExpenseAmount: expenses.reduce((sum, expense) => sum + Number(expense.amount), 0),
      },
      recentActivity: {
        recentExpenses,
        topQuestionnaires,
        recentResponses: responses
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
          .slice(0, 10)
          .map(r => ({
            id: r.id,
            questionnaireId: r.questionnaireId,
            score: r.score,
            submittedAt: r.submittedAt,
          })),
      },
      charts: {
        monthlyExpenses,
        expenseByCategory: this.groupExpensesByCategory(expenses),
        responseTrends: this.calculateResponseTrends(responses),
      },
    };
  }

  async getOrganizationReports(organizationId: string, startDate?: string, endDate?: string) {
    const where: any = { organizationId };
    
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const reports = await this.reportRepository.find({
      where,
      relations: ['generatedBy'],
      order: { createdAt: 'DESC' },
    });

    const expenses = await this.expenseRepository.find({
      where: {
        organizationId,
        ...(startDate && endDate ? {
          expenseDate: Between(new Date(startDate), new Date(endDate)),
        } : {}),
      },
      order: { expenseDate: 'DESC' },
    });

    const totalExpense = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    return {
      reports,
      financialSummary: {
        totalExpense,
        expenseCount: expenses.length,
        byCategory: this.groupExpensesByCategory(expenses),
        byStatus: this.groupExpensesByStatus(expenses),
      },
    };
  }

  async exportReport(id: string, format: string) {
    const report = await this.findOne(id);
    
    if (!['pdf', 'excel', 'csv'].includes(format)) {
      throw new BadRequestException('Дэмжигдэхгүй формат: pdf, excel, csv зөвхөн');
    }

    // Export логик энд орно
    return {
      report,
      format,
      downloadUrl: `/api/reports/export/${id}/file.${format}`,
      message: `${format.toUpperCase()} форматтай тайлан бэлэн боллоо`,
    };
  }

  private async generateQuestionnaireReport(
    questionnaireId: string,
    organizationId: string,
    startDate: string,
    endDate: string,
  ) {
    const questionnaire = await this.questionnaireRepository.findOne({
      where: { id: questionnaireId },
      relations: ['questions', 'responses', 'responses.user'],
    });

    if (!questionnaire) {
      throw new NotFoundException(`Асуулга олдсонгүй: ${questionnaireId}`);
    }

    const responses = questionnaire.responses.filter(
      response =>
        response.submittedAt >= new Date(startDate) &&
        response.submittedAt <= new Date(endDate) &&
        response.organizationId === organizationId,
    );

    const analysis = ScoringUtils.analyzeQuestionnaireResponses(questionnaire, responses);

    return {
      questionnaire: {
        id: questionnaire.id,
        title: questionnaire.title,
        description: questionnaire.description,
        questionCount: questionnaire.questions.length,
      },
      period: { startDate, endDate },
      responses: {
        total: responses.length,
        averageScore: analysis.averageScore,
        completionRate: analysis.completionRate,
        scoreDistribution: analysis.scoreDistribution,
      },
      detailedAnalysis: analysis.detailedAnalysis,
      recommendations: analysis.recommendations,
    };
  }

  private async generateExpenseReport(
    organizationId: string,
    startDate: string,
    endDate: string,
  ) {
    const expenses = await this.expenseRepository.find({
      where: {
        organizationId,
        expenseDate: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['creator', 'approver', 'questionnaire'],
      order: { expenseDate: 'DESC' },
    });

    const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

    return {
      period: { startDate, endDate },
      summary: {
        totalExpenses: expenses.length,
        totalAmount,
        averageExpense: expenses.length > 0 ? totalAmount / expenses.length : 0,
      },
      breakdown: {
        byCategory: this.groupExpensesByCategory(expenses),
        byStatus: this.groupExpensesByStatus(expenses),
        monthly: this.calculateMonthlyExpenses(expenses),
      },
      topExpenses: expenses
        .sort((a, b) => Number(b.amount) - Number(a.amount))
        .slice(0, 10)
        .map(expense => ({
          id: expense.id,
          name: expense.name,
          amount: expense.amount,
          category: expense.category,
          date: expense.expenseDate,
        })),
      detailedList: expenses.map(expense => ({
        id: expense.id,
        name: expense.name,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        status: expense.status,
        date: expense.expenseDate,
        recipient: expense.recipientName,
        createdBy: expense.creator?.email,
        approvedBy: expense.approver?.email,
      })),
    };
  }

  private async generateCombinedReport(
    organizationId: string,
    startDate: string,
    endDate: string,
  ) {
    const [questionnaireReport, expenseReport] = await Promise.all([
      this.generateQuestionnaireReportForOrganization(organizationId, startDate, endDate),
      this.generateExpenseReport(organizationId, startDate, endDate),
    ]);

    return {
      period: { startDate, endDate },
      questionnaireAnalysis: questionnaireReport,
      financialAnalysis: expenseReport,
      overallAssessment: this.calculateOverallAssessment(questionnaireReport, expenseReport),
      kpis: this.calculateKPIs(questionnaireReport, expenseReport),
    };
  }

  private async generateQuestionnaireReportForOrganization(
    organizationId: string,
    startDate: string,
    endDate: string,
  ) {
    const questionnaires = await this.questionnaireRepository.find({
      where: {
        organizationId,
        createdAt: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['responses'],
    });

    const allResponses = questionnaires.flatMap(q => q.responses);
    const totalResponses = allResponses.length;
    const avgScore = totalResponses > 0
      ? allResponses.reduce((sum, r) => sum + (r.score || 0), 0) / totalResponses
      : 0;

    return {
      totalQuestionnaires: questionnaires.length,
      totalResponses,
      averageScore: avgScore,
      completionRate: questionnaires.length > 0
        ? (totalResponses / questionnaires.length) * 100
        : 0,
      byQuestionnaire: questionnaires.map(q => ({
        id: q.id,
        title: q.title,
        responseCount: q.responses.length,
        averageScore: q.responses.length > 0
          ? q.responses.reduce((sum, r) => sum + (r.score || 0), 0) / q.responses.length
          : 0,
      })),
    };
  }

  private groupExpensesByCategory(expenses: Expense[]) {
    const result: Record<string, { count: number; amount: number }> = {};

    expenses.forEach(expense => {
      if (!result[expense.category]) {
        result[expense.category] = { count: 0, amount: 0 };
      }
      result[expense.category].count++;
      result[expense.category].amount += Number(expense.amount);
    });

    return result;
  }

  private groupExpensesByStatus(expenses: Expense[]) {
    const result: Record<string, { count: number; amount: number }> = {};

    expenses.forEach(expense => {
      if (!result[expense.status]) {
        result[expense.status] = { count: 0, amount: 0 };
      }
      result[expense.status].count++;
      result[expense.status].amount += Number(expense.amount);
    });

    return result;
  }

  private calculateMonthlyExpenses(expenses: Expense[]) {
    const result: Record<string, number> = {};

    expenses.forEach(expense => {
      const monthKey = `${expense.expenseDate.getFullYear()}-${(expense.expenseDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      
      if (!result[monthKey]) {
        result[monthKey] = 0;
      }
      result[monthKey] += Number(expense.amount);
    });

    return result;
  }

  private calculateResponseTrends(responses: Response[]) {
    const result: Record<string, number> = {};

    responses.forEach(response => {
      const monthKey = `${response.submittedAt.getFullYear()}-${(response.submittedAt.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      
      if (!result[monthKey]) {
        result[monthKey] = 0;
      }
      result[monthKey]++;
    });

    return result;
  }

  private calculateOverallAssessment(qReport: any, eReport: any) {
    const financialHealth = this.assessFinancialHealth(eReport.summary.totalAmount);
    const engagementLevel = this.assessEngagementLevel(qReport.averageScore, qReport.completionRate);

    return {
      financialHealth,
      engagementLevel,
      overallScore: (financialHealth.score + engagementLevel.score) / 2,
      recommendations: [
        ...financialHealth.recommendations,
        ...engagementLevel.recommendations,
      ],
    };
  }

  private calculateKPIs(qReport: any, eReport: any) {
    return {
      costPerResponse: qReport.totalResponses > 0
        ? eReport.summary.totalAmount / qReport.totalResponses
        : 0,
      responseRate: qReport.completionRate,
      expenseEfficiency: this.calculateExpenseEfficiency(qReport, eReport),
      roi: this.calculateROI(qReport, eReport),
    };
  }

  private assessFinancialHealth(totalExpenses: number) {
    let score = 100;
    let level = 'сайн';
    const recommendations: string[] = [];

    if (totalExpenses > 10000000) {
      score -= 30;
      level = 'анхаарал шаардсан';
      recommendations.push('Зардлыг бууруулах арга хэмжээ авна уу');
    } else if (totalExpenses > 5000000) {
      score -= 15;
      level = 'хэвийн';
      recommendations.push('Зардлын мониторинг хийх');
    }

    return { score, level, recommendations };
  }

  private assessEngagementLevel(avgScore: number, completionRate: number) {
    let score = (avgScore * 10 + completionRate) / 2;
    let level = '';

    if (score >= 80) {
      level = 'өндөр';
    } else if (score >= 60) {
      level = 'дунд';
    } else {
      level = 'бага';
    }

    const recommendations: string[] = [];
    if (completionRate < 50) {
      recommendations.push('Асуулгын оролцоог нэмэгдүүлэх арга хэмжээ авна уу');
    }
    if (avgScore < 6) {
      recommendations.push('Асуулгын агуулга, бүтцийг сайжруулах');
    }

    return { score, level, recommendations };
  }

  private calculateExpenseEfficiency(qReport: any, eReport: any) {
    if (qReport.totalResponses === 0) return 0;
    return eReport.summary.totalAmount / qReport.totalResponses;
  }

  private calculateROI(qReport: any, eReport: any) {
    if (eReport.summary.totalAmount === 0) return 0;
    return (qReport.averageScore * 10000) / eReport.summary.totalAmount;
  }
}