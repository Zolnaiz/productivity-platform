import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UserRole, PaginationParams } from '../shared/constants';
import { UsersService } from '../users/users.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    private usersService: UsersService,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    // Check if organization with same name already exists
    const existingOrg = await this.organizationsRepository.findOne({
      where: { name: createOrganizationDto.name },
    });

    if (existingOrg) {
      throw new ConflictException('Organization with this name already exists');
    }

    // Create organization
    const organization = this.organizationsRepository.create(
      createOrganizationDto,
    );

    return this.organizationsRepository.save(organization);
  }

  async findAll(params: PaginationParams & { isActive?: boolean }) {
    const { page, limit, search, isActive } = params;
    const skip = (page - 1) * limit;

    const query = this.organizationsRepository
      .createQueryBuilder('organization')
      .leftJoinAndSelect('organization.users', 'users');

    // Filter by active status
    if (isActive !== undefined) {
      query.andWhere('organization.isActive = :isActive', { isActive });
    }

    // Search
    if (search) {
      query.andWhere(
        '(organization.name LIKE :search OR organization.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const organizations = await query
      .skip(skip)
      .take(limit)
      .orderBy('organization.createdAt', 'DESC')
      .getMany();

    return {
      data: organizations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const organization = await this.organizationsRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async getMyOrganization(organizationId?: string) {
    if (!organizationId) {
      throw new NotFoundException('User is not associated with any organization');
    }

    const organization = await this.organizationsRepository.findOne({
      where: { id: organizationId },
      relations: ['users'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    const organization = await this.findOne(id);

    // Check if name is being changed and if it's already taken
    if (
      updateOrganizationDto.name &&
      updateOrganizationDto.name !== organization.name
    ) {
      const existingOrg = await this.organizationsRepository.findOne({
        where: { name: updateOrganizationDto.name },
      });
      if (existingOrg && existingOrg.id !== id) {
        throw new ConflictException('Organization name already in use');
      }
    }

    Object.assign(organization, updateOrganizationDto);
    return this.organizationsRepository.save(organization);
  }

  async remove(id: string) {
    const organization = await this.findOne(id);

    // Check if organization has users
    const userCount = await this.usersService['usersRepository'].count({
      where: { organizationId: id },
    });

    if (userCount > 0) {
      throw new BadRequestException(
        'Cannot delete organization with active users',
      );
    }

    // Soft delete
    organization.isActive = false;
    organization.deletedAt = new Date();

    return this.organizationsRepository.save(organization);
  }

  async activate(id: string) {
    const organization = await this.findOne(id);
    organization.isActive = true;
    return this.organizationsRepository.save(organization);
  }

  async deactivate(id: string) {
    const organization = await this.findOne(id);
    organization.isActive = false;
    return this.organizationsRepository.save(organization);
  }

  async getUsers(
    organizationId: string,
    params: PaginationParams,
    currentUser: any,
  ) {
    // Check if organization exists
    const organization = await this.findOne(organizationId);

    // Check permissions
    this.checkOrganizationAccess(organization, currentUser);

    return this.usersService.findAll(params, organizationId, currentUser.role);
  }

  async getStats(organizationId: string, currentUser: any) {
    // Check if organization exists
    const organization = await this.findOne(organizationId);

    // Check permissions
    this.checkOrganizationAccess(organization, currentUser);

    // Get user count by role
    const userStats = await this.usersService['usersRepository']
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.organizationId = :organizationId', { organizationId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .groupBy('user.role')
      .getRawMany();

    // Get questionnaire count
    const questionnaireCount = await this.organizationsRepository.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('questionnaires', 'q')
      .where('q.organization_id = :organizationId', { organizationId })
      .andWhere('q.is_active = :isActive', { isActive: true })
      .getRawOne();

    // Get response count
    const responseCount = await this.organizationsRepository.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('responses', 'r')
      .where('r.organization_id = :organizationId', { organizationId })
      .getRawOne();

    // Get expense statistics
    const expenseStats = await this.organizationsRepository.manager
      .createQueryBuilder()
      .select('SUM(e.amount)', 'totalAmount')
      .addSelect('AVG(e.amount)', 'averageAmount')
      .addSelect('COUNT(*)', 'count')
      .from('expenses', 'e')
      .where('e.organization_id = :organizationId', { organizationId })
      .andWhere('e.status = :status', { status: 'approved' })
      .getRawOne();

    return {
      organizationId,
      userStats,
      questionnaireCount: parseInt(questionnaireCount.count) || 0,
      responseCount: parseInt(responseCount.count) || 0,
      expenseStats: {
        totalAmount: parseFloat(expenseStats.totalAmount) || 0,
        averageAmount: parseFloat(expenseStats.averageAmount) || 0,
        count: parseInt(expenseStats.count) || 0,
      },
      updatedAt: new Date(),
    };
  }

  async inviteUser(
    organizationId: string,
    email: string,
    role: UserRole,
    currentUser: any,
  ) {
    // Check if organization exists
    const organization = await this.findOne(organizationId);

    // Check permissions
    this.checkOrganizationAccess(organization, currentUser);

    // Check if user can assign this role
    if (!this.canAssignRole(currentUser.role, role)) {
      throw new ForbiddenException('You cannot assign this role');
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      // Check if user is already in this organization
      if (existingUser.organizationId === organizationId) {
        throw new ConflictException('User is already in this organization');
      }

      // Update user's organization
      existingUser.organizationId = organizationId;
      existingUser.role = role;
      await this.usersService['usersRepository'].save(existingUser);

      return {
        message: 'User added to organization successfully',
        user: existingUser,
      };
    } else {
      // Create new user with invitation
      // In a real application, you would send an invitation email
      // For now, we'll create the user with a temporary password
      const temporaryPassword = this.generateTemporaryPassword();

      const user = await this.usersService.create(
        {
          email,
          firstName: 'Invited',
          lastName: 'User',
          password: temporaryPassword,
          role,
          organizationId,
          isActive: false, // User needs to activate account
        },
        organizationId,
      );

      return {
        message: 'Invitation sent successfully',
        user,
        // In production, don't return the temporary password
        temporaryPassword,
      };
    }
  }

  async removeUser(
    organizationId: string,
    userId: string,
    currentUser: any,
  ) {
    // Check if organization exists
    const organization = await this.findOne(organizationId);

    // Check permissions
    this.checkOrganizationAccess(organization, currentUser);

    // Get user
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user belongs to this organization
    if (user.organizationId !== organizationId) {
      throw new BadRequestException('User does not belong to this organization');
    }

    // Prevent removing yourself
    if (user.id === currentUser.id) {
      throw new BadRequestException('Cannot remove yourself from organization');
    }

    // Remove user from organization
    user.organizationId = null;
    user.role = UserRole.USER;
    await this.usersService['usersRepository'].save(user);

    return {
      message: 'User removed from organization successfully',
    };
  }

  private checkOrganizationAccess(organization: Organization, currentUser: any) {
    // Super admin can access all organizations
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Organization admin can only access their organization
    if (
      currentUser.role === UserRole.ORGANIZATION_ADMIN &&
      organization.id === currentUser.organizationId
    ) {
      return;
    }

    // Regular users cannot access organization details
    throw new ForbiddenException('Access denied');
  }

  private canAssignRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.SUPER_ADMIN]: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.USER],
      [UserRole.ORGANIZATION_ADMIN]: [UserRole.ORGANIZATION_ADMIN, UserRole.USER],
      [UserRole.USER]: [],
    };

    return roleHierarchy[currentUserRole]?.includes(targetRole) || false;
  }

  private generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }
}