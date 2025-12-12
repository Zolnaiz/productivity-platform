import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from './entities/expense.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpenseCategory, ExpenseStatus, UserRole, PaginationParams } from '../shared/constants';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private expensesRepository: Repository<Expense>,
  ) {}

  async create(createExpenseDto: CreateExpenseDto, user: any) {
    // Validate that user has access to the organization
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      createExpenseDto.organizationId !== user.organizationId
    ) {
      throw new ForbiddenException('You can only create expenses for your organization');
    }

    // Create expense
    const expense = this.expensesRepository.create({
      ...createExpenseDto,
      userId: user.id,
      status: ExpenseStatus.PENDING,
    });

    return this.expensesRepository.save(expense);
  }

  async findAll(params: any, user: any) {
    const {
      page,
      limit,
      search,
      category,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    } = params;
    const skip = (page - 1) * limit;

    const query = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.organization', 'organization')
      .leftJoinAndSelect('expense.user', 'user')
      .leftJoinAndSelect('expense.approvedByUser', 'approvedByUser')
      .leftJoinAndSelect('expense.paidByUser', 'paidByUser');

    // Apply filters based on user role
    if (user.role === UserRole.SUPER_ADMIN) {
      // Super admin can see all expenses
      // No additional filters needed
    } else if (user.role === UserRole.ORGANIZATION_ADMIN) {
      // Organization admin can only see expenses from their organization
      query.andWhere('expense.organizationId = :organizationId', {
        organizationId: user.organizationId,
      });
    } else {
      // Regular users can only see their own expenses
      query.andWhere('expense.userId = :userId', { userId: user.id });
    }

    // Apply additional filters
    if (category) {
      query.andWhere('expense.category = :category', { category });
    }

    if (status) {
      query.andWhere('expense.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(expense.title LIKE :search OR expense.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (startDate) {
      query.andWhere('expense.date >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      query.andWhere('expense.date <= :endDate', { endDate: new Date(endDate) });
    }

    if (minAmount !== undefined) {
      query.andWhere('expense.amount >= :minAmount', { minAmount });
    }

    if (maxAmount !== undefined) {
      query.andWhere('expense.amount <= :maxAmount', { maxAmount });
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const expenses = await query
      .skip(skip)
      .take(limit)
      .orderBy('expense.createdAt', 'DESC')
      .getMany();

    return {
      data: expenses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: any) {
    const expense = await this.expensesRepository.findOne({
      where: { id },
      relations: [
        'organization',
        'user',
        'approvedByUser',
        'paidByUser',
      ],
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    // Check permissions
    this.checkExpenseAccess(expense, user);

    return expense;
  }

  async findMyExpenses(params: any, user: any) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const query = this.expensesRepository
      .createQueryBuilder('expense')
      .where('expense.userId = :userId', { userId: user.id });

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const expenses = await query
      .skip(skip)
      .take(limit)
      .orderBy('expense.createdAt', 'DESC')
      .getMany();

    return {
      data: expenses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPending(params: any, user: any) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;

    const query = this.expensesRepository
      .createQueryBuilder('expense')
      .where('expense.status = :status', { status: ExpenseStatus.PENDING });

    // Apply organization filter for non-super admins
    if (user.role !== UserRole.SUPER_ADMIN) {
      query.andWhere('expense.organizationId = :organizationId', {
        organizationId: user.organizationId,
      });
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const expenses = await query
      .skip(skip)
      .take(limit)
      .orderBy('expense.createdAt', 'DESC')
      .getMany();

    return {
      data: expenses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto, user: any) {
    const expense = await this.findOne(id, user);

    // Check if expense can be updated
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Only pending expenses can be updated');
    }

    // Check if user can update this expense
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ORGANIZATION_ADMIN &&
      expense.userId !== user.id
    ) {
      throw new ForbiddenException('You can only update your own pending expenses');
    }

    Object.assign(expense, updateExpenseDto);
    return this.expensesRepository.save(expense);
  }

  async remove(id: string, user: any) {
    const expense = await this.findOne(id, user);

    // Check if expense can be deleted
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Only pending expenses can be deleted');
    }

    // Check if user can delete this expense
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ORGANIZATION_ADMIN &&
      expense.userId !== user.id
    ) {
      throw new ForbiddenException('You can only delete your own pending expenses');
    }

    return this.expensesRepository.remove(expense);
  }

  async submit(id: string, user: any) {
    const expense = await this.findOne(id, user);

    // Check if expense can be submitted
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Expense is already submitted');
    }

    // Check if user can submit this expense
    if (expense.userId !== user.id) {
      throw new ForbiddenException('You can only submit your own expenses');
    }

    // Validate that expense has required fields
    if (!expense.title || !expense.amount || !expense.category) {
      throw new BadRequestException('Expense must have title, amount, and category');
    }

    // Update status
    expense.status = ExpenseStatus.PENDING; // Already pending, but this confirms submission
    return this.expensesRepository.save(expense);
  }

  async approve(id: string, user: any, comments?: string) {
    const expense = await this.findOne(id, user);

    // Check if expense can be approved
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Only pending expenses can be approved');
    }

    // Check if user can approve expenses
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ORGANIZATION_ADMIN
    ) {
      throw new ForbiddenException('You do not have permission to approve expenses');
    }

    // Check organization access for non-super admins
    if (
      user.role === UserRole.ORGANIZATION_ADMIN &&
      expense.organizationId !== user.organizationId
    ) {
      throw new ForbiddenException('You can only approve expenses from your organization');
    }

    // Update expense
    expense.status = ExpenseStatus.APPROVED;
    expense.approvedBy = user.id;
    expense.approvedAt = new Date();
    expense.approvalComments = comments;

    return this.expensesRepository.save(expense);
  }

  async reject(id: string, user: any, reason: string) {
    const expense = await this.findOne(id, user);

    // Check if expense can be rejected
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Only pending expenses can be rejected');
    }

    // Check if user can reject expenses
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ORGANIZATION_ADMIN
    ) {
      throw new ForbiddenException('You do not have permission to reject expenses');
    }

    // Check organization access for non-super admins
    if (
      user.role === UserRole.ORGANIZATION_ADMIN &&
      expense.organizationId !== user.organizationId
    ) {
      throw new ForbiddenException('You can only reject expenses from your organization');
    }

    // Update expense
    expense.status = ExpenseStatus.REJECTED;
    expense.rejectedReason = reason;
    expense.rejectedAt = new Date();

    return this.expensesRepository.save(expense);
  }

  async pay(id: string, user: any, paymentMethod?: string, paymentReference?: string) {
    const expense = await this.findOne(id, user);

    // Check if expense can be paid
    if (expense.status !== ExpenseStatus.APPROVED) {
      throw new BadRequestException('Only approved expenses can be marked as paid');
    }

    // Check if user can mark expenses as paid
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ORGANIZATION_ADMIN
    ) {
      throw new ForbiddenException('You do not have permission to mark expenses as paid');
    }

    // Check organization access for non-super admins
    if (
      user.role === UserRole.ORGANIZATION_ADMIN &&
      expense.organizationId !== user.organizationId
    ) {
      throw new ForbiddenException('You can only mark expenses from your organization as paid');
    }

    // Update expense
    expense.status = ExpenseStatus.PAID;
    expense.paidBy = user.id;
    expense.paidAt = new Date();
    expense.paymentMethod = paymentMethod;
    expense.paymentReference = paymentReference;

    return this.expensesRepository.save(expense);
  }

  async getAttachments(id: string, user: any) {
    const expense = await this.findOne(id, user);

    return {
      expenseId: id,
      attachments: expense.attachments || [],
      total: expense.attachments?.length || 0,
    };
  }

  async addAttachment(id: string, url: string, name: string, user: any) {
    const expense = await this.findOne(id, user);

    // Check if user can add attachments
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ORGANIZATION_ADMIN &&
      expense.userId !== user.id
    ) {
      throw new ForbiddenException('You do not have permission to add attachments');
    }

    // Initialize attachments array if needed
    if (!expense.attachments) {
      expense.attachments = [];
    }

    // Add attachment
    expense.attachments.push({
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      name,
      uploadedAt: new Date(),
      uploadedBy: user.id,
    });

    return this.expensesRepository.save(expense);
  }

  async removeAttachment(id: string, attachmentId: string, user: any) {
    const expense = await this.findOne(id, user);

    // Check if expense has attachments
    if (!expense.attachments || expense.attachments.length === 0) {
      throw new NotFoundException('No attachments found');
    }

    // Find attachment index
    const attachmentIndex = expense.attachments.findIndex(
      (att) => att.id === attachmentId,
    );

    if (attachmentIndex === -1) {
      throw new NotFoundException('Attachment not found');
    }

    // Check if user can remove attachment
    const attachment = expense.attachments[attachmentIndex];
    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.ORGANIZATION_ADMIN &&
      attachment.uploadedBy !== user.id
    ) {
      throw new ForbiddenException('You do not have permission to remove this attachment');
    }

    // Remove attachment
    expense.attachments.splice(attachmentIndex, 1);

    return this.expensesRepository.save(expense);
  }

  async getOrganizationStats(organizationId: string, startDate?: string, endDate?: string, user?: any) {
    // Check permissions
    if (
      user &&
      user.role !== UserRole.SUPER_ADMIN &&
      user.organizationId !== organizationId
    ) {
      throw new ForbiddenException('Access denied');
    }

    const query = this.expensesRepository
      .createQueryBuilder('expense')
      .select('expense.category', 'category')
      .addSelect('SUM(expense.amount)', 'totalAmount')
      .addSelect('COUNT(expense.id)', 'count')
      .where('expense.organizationId = :organizationId', { organizationId })
      .andWhere('expense.status = :status', { status: ExpenseStatus.APPROVED })
      .groupBy('expense.category');

    if (startDate) {
      query.andWhere('expense.date >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      query.andWhere('expense.date <= :endDate', { endDate: new Date(endDate) });
    }

    const categoryStats = await query.getRawMany();

    // Get total statistics
    const totalStats = await this.expensesRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'totalAmount')
      .addSelect('COUNT(expense.id)', 'totalCount')
      .addSelect('AVG(expense.amount)', 'averageAmount')
      .where('expense.organizationId = :organizationId', { organizationId })
      .andWhere('expense.status = :status', { status: ExpenseStatus.APPROVED })
      .getRawOne();

    // Get status distribution
    const statusStats = await this.expensesRepository
      .createQueryBuilder('expense')
      .select('expense.status', 'status')
      .addSelect('COUNT(expense.id)', 'count')
      .where('expense.organizationId = :organizationId', { organizationId })
      .groupBy('expense.status')
      .getRawMany();

    return {
      organizationId,
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all',
      },
      categoryStats,
      totalStats: {
        totalAmount: parseFloat(totalStats.totalAmount) || 0,
        totalCount: parseInt(totalStats.totalCount) || 0,
        averageAmount: parseFloat(totalStats.averageAmount) || 0,
      },
      statusStats,
      generatedAt: new Date(),
    };
  }

  async getCategoriesSummary(user: any, startDate?: string, endDate?: string) {
    const query = this.expensesRepository
      .createQueryBuilder('expense')
      .select('expense.category', 'category')
      .addSelect('SUM(expense.amount)', 'totalAmount')
      .addSelect('COUNT(expense.id)', 'count');

    // Apply filters based on user role
    if (user.role === UserRole.SUPER_ADMIN) {
      // Super admin can see all expenses
    } else if (user.role === UserRole.ORGANIZATION_ADMIN) {
      query.where('expense.organizationId = :organizationId', {
        organizationId: user.organizationId,
      });
    } else {
      query.where('expense.userId = :userId', { userId: user.id });
    }

    if (startDate) {
      query.andWhere('expense.date >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      query.andWhere('expense.date <= :endDate', { endDate: new Date(endDate) });
    }

    query.groupBy('expense.category');

    const stats = await query.getRawMany();

    // Calculate percentages
    const totalAmount = stats.reduce((sum, stat) => sum + parseFloat(stat.totalAmount), 0);

    const categories = stats.map((stat) => ({
      category: stat.category,
      totalAmount: parseFloat(stat.totalAmount),
      count: parseInt(stat.count),
      percentage: totalAmount > 0 ? (parseFloat(stat.totalAmount) / totalAmount) * 100 : 0,
    }));

    // Sort by total amount (descending)
    categories.sort((a, b) => b.totalAmount - a.totalAmount);

    return {
      categories,
      totalAmount,
      totalCount: categories.reduce((sum, cat) => sum + cat.count, 0),
      period: {
        startDate: startDate || 'all',
        endDate: endDate || 'all',
      },
      generatedAt: new Date(),
    };
  }

  private checkExpenseAccess(expense: Expense, user: any) {
    // Super admin can access all expenses
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Organization admin can access expenses from their organization
    if (
      user.role === UserRole.ORGANIZATION_ADMIN &&
      expense.organizationId === user.organizationId
    ) {
      return;
    }

    // Regular users can only access their own expenses
    if (user.role === UserRole.USER && expense.userId === user.id) {
      return;
    }

    throw new ForbiddenException('Access denied');
  }
}