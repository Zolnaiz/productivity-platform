import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Questionnaire } from './entities/questionnaire.entity';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { UpdateQuestionnaireDto } from './dto/update-questionnaire.dto';
import { UserRole, PaginationParams } from '../shared/constants';

@Injectable()
export class QuestionnairesService {
  constructor(
    @InjectRepository(Questionnaire)
    private questionnairesRepository: Repository<Questionnaire>,
  ) {}

  async create(createQuestionnaireDto: CreateQuestionnaireDto, user: any) {
    // Validate that user has access to the organization
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      createQuestionnaireDto.organizationId !== user.organizationId
    ) {
      throw new ForbiddenException('You can only create questionnaires for your organization');
    }

    // Create questionnaire
    const questionnaire = this.questionnairesRepository.create({
      ...createQuestionnaireDto,
      createdBy: user.id,
    });

    return this.questionnairesRepository.save(questionnaire);
  }

  async findAll(params: any, user: any) {
    const { page, limit, search, organizationId, isActive, expired } = params;
    const skip = (page - 1) * limit;

    const query = this.questionnairesRepository
      .createQueryBuilder('questionnaire')
      .leftJoinAndSelect('questionnaire.organization', 'organization')
      .leftJoinAndSelect('questionnaire.createdByUser', 'createdByUser');

    // Apply filters based on user role
    if (user.role === UserRole.SUPER_ADMIN) {
      // Super admin can see all questionnaires
      if (organizationId) {
        query.andWhere('questionnaire.organizationId = :organizationId', {
          organizationId,
        });
      }
    } else if (user.role === UserRole.ORGANIZATION_ADMIN) {
      // Organization admin can only see questionnaires from their organization
      query.andWhere('questionnaire.organizationId = :organizationId', {
        organizationId: user.organizationId,
      });
    } else {
      // Regular users can only see active questionnaires from their organization
      query.andWhere('questionnaire.organizationId = :organizationId', {
        organizationId: user.organizationId,
      });
      query.andWhere('questionnaire.isActive = :isActive', { isActive: true });
    }

    // Apply additional filters
    if (isActive !== undefined) {
      query.andWhere('questionnaire.isActive = :isActive', { isActive });
    }

    if (expired !== undefined) {
      if (expired) {
        query.andWhere('questionnaire.expiresAt < :now', { now: new Date() });
      } else {
        query.andWhere(
          '(questionnaire.expiresAt IS NULL OR questionnaire.expiresAt >= :now)',
          { now: new Date() },
        );
      }
    }

    // Search
    if (search) {
      query.andWhere(
        '(questionnaire.title LIKE :search OR questionnaire.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const questionnaires = await query
      .skip(skip)
      .take(limit)
      .orderBy('questionnaire.createdAt', 'DESC')
      .getMany();

    return {
      data: questionnaires,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: any) {
    const questionnaire = await this.questionnairesRepository.findOne({
      where: { id },
      relations: ['organization', 'createdByUser', 'questions'],
    });

    if (!questionnaire) {
      throw new NotFoundException(`Questionnaire with ID ${id} not found`);
    }

    // Check permissions
    this.checkQuestionnaireAccess(questionnaire, user);

    return questionnaire;
  }

  async findByOrganization(organizationId: string, params: any, user: any) {
    // Check permissions
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      organizationId !== user.organizationId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const { page, limit, isActive } = params;
    const skip = (page - 1) * limit;

    const query = this.questionnairesRepository
      .createQueryBuilder('questionnaire')
      .where('questionnaire.organizationId = :organizationId', { organizationId });

    if (isActive !== undefined) {
      query.andWhere('questionnaire.isActive = :isActive', { isActive });
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const questionnaires = await query
      .skip(skip)
      .take(limit)
      .orderBy('questionnaire.createdAt', 'DESC')
      .getMany();

    return {
      data: questionnaires,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateQuestionnaireDto: UpdateQuestionnaireDto, user: any) {
    const questionnaire = await this.findOne(id, user);

    // Check if user can update this questionnaire
    this.checkQuestionnaireModificationAccess(questionnaire, user);

    Object.assign(questionnaire, updateQuestionnaireDto);
    return this.questionnairesRepository.save(questionnaire);
  }

  async remove(id: string, user: any) {
    const questionnaire = await this.findOne(id, user);

    // Check if user can delete this questionnaire
    this.checkQuestionnaireModificationAccess(questionnaire, user);

    // Check if questionnaire has responses
    if (questionnaire.responseCount > 0) {
      throw new BadRequestException(
        'Cannot delete questionnaire with responses. Consider deactivating it instead.',
      );
    }

    return this.questionnairesRepository.remove(questionnaire);
  }

  async activate(id: string, user: any) {
    const questionnaire = await this.findOne(id, user);

    // Check if user can modify this questionnaire
    this.checkQuestionnaireModificationAccess(questionnaire, user);

    questionnaire.isActive = true;
    return this.questionnairesRepository.save(questionnaire);
  }

  async deactivate(id: string, user: any) {
    const questionnaire = await this.findOne(id, user);

    // Check if user can modify this questionnaire
    this.checkQuestionnaireModificationAccess(questionnaire, user);

    questionnaire.isActive = false;
    return this.questionnairesRepository.save(questionnaire);
  }

  async getResponses(id: string, params: any, user: any) {
    const questionnaire = await this.findOne(id, user);

    // Check permissions
    this.checkQuestionnaireAccess(questionnaire, user);

    // In a real implementation, this would fetch responses from a separate service
    // For now, return empty response
    return {
      questionnaireId: id,
      responses: [],
      total: 0,
      ...params,
    };
  }

  async getAnalytics(id: string, user: any) {
    const questionnaire = await this.findOne(id, user);

    // Check permissions
    this.checkQuestionnaireAccess(questionnaire, user);

    // Calculate basic analytics
    const responseRate = questionnaire.responseCount > 0 
      ? (questionnaire.responseCount / 100) * 100 // This would be calculated based on target audience
      : 0;

    const averageCompletionTime = 0; // This would be calculated from response data
    const completionRate = 0; // This would be calculated from response data

    // Calculate question-wise analytics
    const questionAnalytics = questionnaire.questions?.map((question) => ({
      questionId: question.id,
      questionText: question.text,
      type: question.type,
      responseCount: 0,
      averageRating: 0,
      options: question.options?.map((option) => ({
        option,
        count: 0,
        percentage: 0,
      })),
    })) || [];

    return {
      questionnaireId: id,
      title: questionnaire.title,
      totalResponses: questionnaire.responseCount,
      responseRate,
      averageCompletionTime,
      completionRate,
      questionAnalytics,
      updatedAt: new Date(),
    };
  }

  async getShareLink(id: string, user: any) {
    const questionnaire = await this.findOne(id, user);

    // Check permissions
    this.checkQuestionnaireAccess(questionnaire, user);

    if (!questionnaire.isActive) {
      throw new BadRequestException('Cannot share inactive questionnaire');
    }

    // Generate a unique share token
    const shareToken = this.generateShareToken();
    const shareLink = `${process.env.FRONTEND_URL}/questionnaires/${id}/share/${shareToken}`;

    return {
      questionnaireId: id,
      shareToken,
      shareLink,
      expiresAt: questionnaire.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: questionnaire.isActive,
    };
  }

  async duplicate(id: string, user: any) {
    const questionnaire = await this.findOne(id, user);

    // Check permissions
    this.checkQuestionnaireAccess(questionnaire, user);

    // Create a copy of the questionnaire
    const duplicatedQuestionnaire = this.questionnairesRepository.create({
      ...questionnaire,
      id: undefined,
      title: `${questionnaire.title} (Copy)`,
      responseCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.id,
    });

    return this.questionnairesRepository.save(duplicatedQuestionnaire);
  }

  async getQuestions(id: string, user: any) {
    const questionnaire = await this.findOne(id, user);

    // Check permissions
    this.checkQuestionnaireAccess(questionnaire, user);

    return {
      questionnaireId: id,
      title: questionnaire.title,
      questions: questionnaire.questions || [],
      totalQuestions: questionnaire.questions?.length || 0,
    };
  }

  private checkQuestionnaireAccess(questionnaire: Questionnaire, user: any) {
    // Super admin can access all questionnaires
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Organization admin and users can only access questionnaires from their organization
    if (questionnaire.organizationId === user.organizationId) {
      return;
    }

    throw new ForbiddenException('Access denied');
  }

  private checkQuestionnaireModificationAccess(questionnaire: Questionnaire, user: any) {
    // Super admin can modify all questionnaires
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Organization admin can modify questionnaires from their organization
    if (
      user.role === UserRole.ORGANIZATION_ADMIN &&
      questionnaire.organizationId === user.organizationId
    ) {
      return;
    }

    // Regular users can only modify questionnaires they created
    if (
      user.role === UserRole.USER &&
      questionnaire.createdBy === user.id &&
      questionnaire.organizationId === user.organizationId
    ) {
      return;
    }

    throw new ForbiddenException('You do not have permission to modify this questionnaire');
  }

  private generateShareToken(): string {
    const length = 32;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return token;
  }
}