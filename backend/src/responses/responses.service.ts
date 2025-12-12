import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Response } from './entities/response.entity';
import { CreateResponseDto } from './dto/create-response.dto';
import { UpdateResponseDto } from './dto/update-response.dto';
import { UserRole, PaginationParams } from '../shared/constants';
import { QuestionnairesService } from '../questionnaires/questionnaires.service';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(Response)
    private responsesRepository: Repository<Response>,
    private questionnairesService: QuestionnairesService,
  ) {}

  async create(createResponseDto: CreateResponseDto, user: any) {
    // Get questionnaire
    const questionnaire = await this.questionnairesService['questionnairesRepository'].findOne({
      where: { id: createResponseDto.questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    // Check permissions
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      questionnaire.organizationId !== user.organizationId
    ) {
      throw new ForbiddenException('Access denied');
    }

    // Check if questionnaire is active and not expired
    if (!questionnaire.isActive || questionnaire.isExpired) {
      throw new BadRequestException('Questionnaire is not active or has expired');
    }

    // Check if user has already submitted a response (if settings require unique responses)
    if (questionnaire.settings?.requireUniqueResponse) {
      const existingResponse = await this.responsesRepository.findOne({
        where: {
          questionnaireId: createResponseDto.questionnaireId,
          userId: user.id,
        },
      });

      if (existingResponse) {
        throw new BadRequestException('You have already submitted a response to this questionnaire');
      }
    }

    // Validate answers against questions
    this.validateAnswers(createResponseDto.answers, questionnaire.questions);

    // Calculate completion time if provided
    let completionTimeSeconds: number | undefined;
    if (createResponseDto.completionTime) {
      completionTimeSeconds = Math.floor(createResponseDto.completionTime / 1000);
    }

    // Create response
    const response = this.responsesRepository.create({
      ...createResponseDto,
      userId: user.id,
      organizationId: questionnaire.organizationId,
      completionTime: completionTimeSeconds,
    });

    const savedResponse = await this.responsesRepository.save(response);

    // Update questionnaire response count
    await this.questionnairesService['questionnairesRepository'].increment(
      { id: questionnaire.id },
      'responseCount',
      1,
    );

    return savedResponse;
  }

  async findAll(params: any, user: any) {
    const { page, limit, questionnaireId, organizationId, userId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const query = this.responsesRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.questionnaire', 'questionnaire')
      .leftJoinAndSelect('response.user', 'user')
      .leftJoinAndSelect('response.organization', 'organization');

    // Apply filters based on user role
    if (user.role === UserRole.SUPER_ADMIN) {
      // Super admin can see all responses
      if (organizationId) {
        query.andWhere('response.organizationId = :organizationId', {
          organizationId,
        });
      }
    } else if (user.role === UserRole.ORGANIZATION_ADMIN) {
      // Organization admin can only see responses from their organization
      query.andWhere('response.organizationId = :organizationId', {
        organizationId: user.organizationId,
      });
    } else {
      // Regular users can only see their own responses
      query.andWhere('response.userId = :userId', { userId: user.id });
    }

    // Apply additional filters
    if (questionnaireId) {
      query.andWhere('response.questionnaireId = :questionnaireId', {
        questionnaireId,
      });
    }

    if (userId && (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ORGANIZATION_ADMIN)) {
      query.andWhere('response.userId = :userId', { userId });
    }

    if (startDate) {
      query.andWhere('response.submittedAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      query.andWhere('response.submittedAt <= :endDate', { endDate: new Date(endDate) });
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const responses = await query
      .skip(skip)
      .take(limit)
      .orderBy('response.submittedAt', 'DESC')
      .getMany();

    return {
      data: responses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: any) {
    const response = await this.responsesRepository.findOne({
      where: { id },
      relations: ['questionnaire', 'user', 'organization'],
    });

    if (!response) {
      throw new NotFoundException(`Response with ID ${id} not found`);
    }

    // Check permissions
    this.checkResponseAccess(response, user);

    return response;
  }

  async findByQuestionnaire(questionnaireId: string, params: any, user: any) {
    // Get questionnaire to check permissions
    const questionnaire = await this.questionnairesService['questionnairesRepository'].findOne({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    // Check permissions
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      questionnaire.organizationId !== user.organizationId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const query = this.responsesRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.user', 'user')
      .where('response.questionnaireId = :questionnaireId', { questionnaireId });

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const responses = await query
      .skip(skip)
      .take(limit)
      .orderBy('response.submittedAt', 'DESC')
      .getMany();

    return {
      data: responses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByUser(userId: string, params: any, currentUser: any) {
    // Check permissions
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      currentUser.role !== UserRole.ORGANIZATION_ADMIN &&
      currentUser.id !== userId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const query = this.responsesRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.questionnaire', 'questionnaire')
      .where('response.userId = :userId', { userId });

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const responses = await query
      .skip(skip)
      .take(limit)
      .orderBy('response.submittedAt', 'DESC')
      .getMany();

    return {
      data: responses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMyResponses(params: any, user: any) {
    return this.findByUser(user.id, params, user);
  }

  async update(id: string, updateResponseDto: UpdateResponseDto, user: any) {
    const response = await this.findOne(id, user);

    // Check permissions - only super admin and organization admin can update responses
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ORGANIZATION_ADMIN) {
      throw new ForbiddenException('You do not have permission to update responses');
    }

    // Get questionnaire to validate answers
    const questionnaire = await this.questionnairesService['questionnairesRepository'].findOne({
      where: { id: response.questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    // Validate answers if provided
    if (updateResponseDto.answers) {
      this.validateAnswers(updateResponseDto.answers, questionnaire.questions);
    }

    Object.assign(response, updateResponseDto);
    return this.responsesRepository.save(response);
  }

  async remove(id: string, user: any) {
    const response = await this.findOne(id, user);

    // Check permissions - only super admin and organization admin can delete responses
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ORGANIZATION_ADMIN) {
      throw new ForbiddenException('You do not have permission to delete responses');
    }

    // Decrement questionnaire response count
    await this.questionnairesService['questionnairesRepository'].decrement(
      { id: response.questionnaireId },
      'responseCount',
      1,
    );

    return this.responsesRepository.remove(response);
  }

  async getAnalysis(id: string, user: any) {
    const response = await this.findOne(id, user);

    // Get questionnaire
    const questionnaire = await this.questionnairesService['questionnairesRepository'].findOne({
      where: { id: response.questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    // Calculate analysis
    const totalQuestions = questionnaire.questions.length;
    const answeredQuestions = response.answers.length;
    const completionPercentage = totalQuestions > 0 
      ? (answeredQuestions / totalQuestions) * 100 
      : 0;

    // Calculate average answer length for text questions
    let totalTextLength = 0;
    let textQuestionCount = 0;

    response.answers.forEach((answer) => {
      const question = questionnaire.questions.find((q) => q.id === answer.questionId);
      if (question && question.type === 'text' && typeof answer.value === 'string') {
        totalTextLength += answer.value.length;
        textQuestionCount++;
      }
    });

    const averageTextLength = textQuestionCount > 0 
      ? totalTextLength / textQuestionCount 
      : 0;

    return {
      responseId: id,
      questionnaireId: response.questionnaireId,
      questionnaireTitle: questionnaire.title,
      userId: response.userId,
      submittedAt: response.submittedAt,
      completionTime: response.completionTime,
      totalQuestions,
      answeredQuestions,
      completionPercentage,
      averageTextLength,
      answers: response.answers.map((answer) => {
        const question = questionnaire.questions.find((q) => q.id === answer.questionId);
        return {
          questionId: answer.questionId,
          questionText: question?.text || 'Unknown question',
          questionType: question?.type,
          answer: answer.value,
          answeredAt: answer.answeredAt,
        };
      }),
    };
  }

  async exportResponses(questionnaireId: string, format: string, user: any) {
    // Get questionnaire to check permissions
    const questionnaire = await this.questionnairesService['questionnairesRepository'].findOne({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    // Check permissions
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      questionnaire.organizationId !== user.organizationId
    ) {
      throw new ForbiddenException('Access denied');
    }

    // Get all responses for this questionnaire
    const responses = await this.responsesRepository.find({
      where: { questionnaireId },
      relations: ['user'],
      order: { submittedAt: 'DESC' },
    });

    // Get questionnaire questions
    const questions = questionnaire.questions;

    // Format data based on requested format
    let exportData: any;

    switch (format) {
      case 'csv':
        exportData = this.formatAsCSV(responses, questions);
        break;
      case 'excel':
        exportData = this.formatAsExcel(responses, questions);
        break;
      case 'json':
      default:
        exportData = this.formatAsJSON(responses, questions);
        break;
    }

    return {
      questionnaireId,
      questionnaireTitle: questionnaire.title,
      format,
      totalResponses: responses.length,
      generatedAt: new Date(),
      data: exportData,
    };
  }

  async getQuestionnaireSummary(questionnaireId: string, user: any) {
    // Get questionnaire
    const questionnaire = await this.questionnairesService['questionnairesRepository'].findOne({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    // Check permissions
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      questionnaire.organizationId !== user.organizationId
    ) {
      throw new ForbiddenException('Access denied');
    }

    // Get response statistics
    const responseStats = await this.responsesRepository
      .createQueryBuilder('response')
      .select('DATE(response.submittedAt)', 'date')
      .addSelect('COUNT(response.id)', 'count')
      .where('response.questionnaireId = :questionnaireId', { questionnaireId })
      .groupBy('DATE(response.submittedAt)')
      .orderBy('date', 'DESC')
      .limit(30)
      .getRawMany();

    // Get average completion time
    const avgCompletionTime = await this.responsesRepository
      .createQueryBuilder('response')
      .select('AVG(response.completionTime)', 'average')
      .where('response.questionnaireId = :questionnaireId', { questionnaireId })
      .andWhere('response.completionTime IS NOT NULL')
      .getRawOne();

    // Get response count by day of week
    const byDayOfWeek = await this.responsesRepository
      .createQueryBuilder('response')
      .select('EXTRACT(DOW FROM response.submittedAt)', 'dayOfWeek')
      .addSelect('COUNT(response.id)', 'count')
      .where('response.questionnaireId = :questionnaireId', { questionnaireId })
      .groupBy('EXTRACT(DOW FROM response.submittedAt)')
      .getRawMany();

    return {
      questionnaireId,
      questionnaireTitle: questionnaire.title,
      totalResponses: questionnaire.responseCount,
      responseStats,
      averageCompletionTime: parseFloat(avgCompletionTime?.average) || 0,
      byDayOfWeek,
      lastResponse: questionnaire.responseCount > 0 
        ? await this.responsesRepository.findOne({
            where: { questionnaireId },
            order: { submittedAt: 'DESC' },
          })
        : null,
    };
  }

  async bulkDelete(questionnaireId: string, responseIds: string[], user: any) {
    // Get questionnaire to check permissions
    const questionnaire = await this.questionnairesService['questionnairesRepository'].findOne({
      where: { id: questionnaireId },
    });

    if (!questionnaire) {
      throw new NotFoundException('Questionnaire not found');
    }

    // Check permissions
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      questionnaire.organizationId !== user.organizationId
    ) {
      throw new ForbiddenException('Access denied');
    }

    // Delete responses
    const result = await this.responsesRepository.delete({
      id: In(responseIds),
      questionnaireId,
    });

    // Update questionnaire response count
    if (result.affected && result.affected > 0) {
      await this.questionnairesService['questionnairesRepository'].decrement(
        { id: questionnaireId },
        'responseCount',
        result.affected,
      );
    }

    return {
      message: `${result.affected} responses deleted successfully`,
      deletedCount: result.affected,
    };
  }

  private checkResponseAccess(response: Response, user: any) {
    // Super admin can access all responses
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Organization admin can access responses from their organization
    if (
      user.role === UserRole.ORGANIZATION_ADMIN &&
      response.organizationId === user.organizationId
    ) {
      return;
    }

    // Regular users can only access their own responses
    if (user.role === UserRole.USER && response.userId === user.id) {
      return;
    }

    throw new ForbiddenException('Access denied');
  }

  private validateAnswers(answers: Array<{ questionId: string; value: any }>, questions: any[]) {
    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.questionId);
      
      if (!question) {
        throw new BadRequestException(`Question with ID ${answer.questionId} not found`);
      }

      // Check if answer is required
      if (question.isRequired && (answer.value === undefined || answer.value === null || answer.value === '')) {
        throw new BadRequestException(`Answer for question "${question.text}" is required`);
      }

      // Validate answer based on question type
      switch (question.type) {
        case 'multiple_choice':
          if (!Array.isArray(answer.value)) {
            throw new BadRequestException(`Answer for question "${question.text}" must be an array`);
          }
          if (question.options && answer.value.some((val: string) => !question.options?.includes(val))) {
            throw new BadRequestException(`Invalid choice for question "${question.text}"`);
          }
          break;
        
        case 'single_choice':
          if (question.options && !question.options.includes(answer.value)) {
            throw new BadRequestException(`Invalid choice for question "${question.text}"`);
          }
          break;
        
        case 'rating':
        case 'number':
          const numValue = Number(answer.value);
          if (isNaN(numValue)) {
            throw new BadRequestException(`Answer for question "${question.text}" must be a number`);
          }
          if (question.minValue !== undefined && numValue < question.minValue) {
            throw new BadRequestException(`Answer for question "${question.text}" must be at least ${question.minValue}`);
          }
          if (question.maxValue !== undefined && numValue > question.maxValue) {
            throw new BadRequestException(`Answer for question "${question.text}" must be at most ${question.maxValue}`);
          }
          break;
        
        case 'date':
          if (isNaN(Date.parse(answer.value))) {
            throw new BadRequestException(`Answer for question "${question.text}" must be a valid date`);
          }
          break;
        
        case 'text':
          if (typeof answer.value !== 'string') {
            throw new BadRequestException(`Answer for question "${question.text}" must be text`);
          }
          break;
      }
    }
  }

  private formatAsCSV(responses: Response[], questions: any[]): string {
    // Create headers
    const headers = ['Response ID', 'User', 'Submitted At', 'Completion Time (s)'];
    questions.forEach((q) => {
      headers.push(`Q: ${q.text}`);
    });

    // Create rows
    const rows = responses.map((response) => {
      const row = [
        response.id,
        response.user?.email || 'Anonymous',
        response.submittedAt.toISOString(),
        response.completionTime || 'N/A',
      ];

      // Add answers
      questions.forEach((question) => {
        const answer = response.answers.find((a) => a.questionId === question.id);
        row.push(answer ? this.formatAnswerValue(answer.value) : '');
      });

      return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  private formatAsExcel(responses: Response[], questions: any[]): any {
    // This would generate Excel file in a real implementation
    // For now, return the same data as CSV but indicate Excel format
    return {
      format: 'excel',
      data: this.formatAsCSV(responses, questions),
      fileName: `responses_${Date.now()}.xlsx`,
    };
  }

  private formatAsJSON(responses: Response[], questions: any[]): any {
    return responses.map((response) => ({
      id: response.id,
      questionnaireId: response.questionnaireId,
      userId: response.userId,
      userEmail: response.user?.email,
      submittedAt: response.submittedAt,
      completionTime: response.completionTime,
      metadata: response.metadata,
      answers: response.answers.map((answer) => {
        const question = questions.find((q) => q.id === answer.questionId);
        return {
          questionId: answer.questionId,
          questionText: question?.text,
          questionType: question?.type,
          value: answer.value,
          answeredAt: answer.answeredAt,
        };
      }),
    }));
  }

  private formatAnswerValue(value: any): string {
    if (Array.isArray(value)) {
      return value.join('; ');
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value);
  }
}