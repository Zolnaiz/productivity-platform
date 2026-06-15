import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, PaginationParams } from '../shared/constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, organizationId?: string) {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      organizationId: organizationId || createUserDto.organizationId,
    });

    return this.usersRepository.save(user);
  }

  async findAll(
    params: PaginationParams,
    organizationId?: string,
    userRole?: UserRole,
  ) {
    const { page, limit, search, role } = params;
    const skip = (page - 1) * limit;

    const query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .where('user.isActive = :isActive', { isActive: true });

    // Filter by organization if not super admin
    if (userRole !== UserRole.SUPER_ADMIN && organizationId) {
      query.andWhere('user.organizationId = :organizationId', {
        organizationId,
      });
    }

    // Filter by role
    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    // Search
    if (search) {
      query.andWhere(
        '(user.email LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const users = await query
      .skip(skip)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getMany();

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: any) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check permissions
    this.checkUserAccess(user, currentUser);

    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['organization'],
    });
  }

  async findById(id: string) {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['organization'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: any) {
    const user = await this.findOne(id, currentUser);

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Users can only update certain fields in their profile
    const allowedFields = [
      'firstName',
      'lastName',
      'phone',
      'position',
      'profileImageUrl',
    ];

    const filteredUpdate: Partial<User> = {};
    for (const field of allowedFields) {
      if (updateUserDto[field] !== undefined) {
        filteredUpdate[field] = updateUserDto[field];
      }
    }

    // Check if email is being changed
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email already in use');
      }
      filteredUpdate.email = updateUserDto.email;
    }

    Object.assign(user, filteredUpdate);
    return this.usersRepository.save(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    return this.usersRepository.save(user);
  }

  async remove(id: string, currentUser: any) {
    const user = await this.findOne(id, currentUser);

    // Prevent self-deletion
    if (user.id === currentUser.id) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Soft delete
    user.isActive = false;
    user.deletedAt = new Date();
    
    return this.usersRepository.save(user);
  }

  async activate(id: string, currentUser: any) {
    const user = await this.findOne(id, currentUser);
    
    user.isActive = true;
    return this.usersRepository.save(user);
  }

  async deactivate(id: string, currentUser: any) {
    const user = await this.findOne(id, currentUser);

    // Prevent self-deactivation
    if (user.id === currentUser.id) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    user.isActive = false;
    return this.usersRepository.save(user);
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getPermissions(id: string, currentUser: any) {
    const user = await this.findOne(id, currentUser);

    // Get permissions based on role
    const permissions = this.getRolePermissions(user.role);

    return {
      userId: user.id,
      role: user.role,
      permissions,
    };
  }

  async changeRole(id: string, role: UserRole, currentUser: any) {
    const user = await this.findOne(id, currentUser);

    // Check if current user can assign this role
    if (!this.canAssignRole(currentUser.role, role)) {
      throw new ForbiddenException('You cannot assign this role');
    }

    user.role = role;
    return this.usersRepository.save(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private checkUserAccess(user: User, currentUser: any) {
    // Super admin can access all users
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    // Organization admin can only access users in their organization
    if (
      (currentUser.role === UserRole.ORGANIZATION_ADMIN || currentUser.role === UserRole.ADMIN) &&
      user.organizationId === currentUser.organizationId
    ) {
      return;
    }

    // Regular users can only access themselves
    if (currentUser.role === UserRole.USER && user.id === currentUser.id) {
      return;
    }

    throw new ForbiddenException('Access denied');
  }

  private getRolePermissions(role: UserRole): string[] {
    const permissions = {
      [UserRole.SUPER_ADMIN]: [
        'users:read',
        'users:create',
        'users:update',
        'users:delete',
        'organizations:read',
        'organizations:create',
        'organizations:update',
        'organizations:delete',
        'questionnaires:read',
        'questionnaires:create',
        'questionnaires:update',
        'questionnaires:delete',
        'responses:read',
        'responses:create',
        'responses:update',
        'responses:delete',
        'expenses:read',
        'expenses:create',
        'expenses:update',
        'expenses:delete',
        'reports:read',
        'reports:create',
        'reports:update',
        'reports:delete',
      ],
      [UserRole.ORGANIZATION_ADMIN]: [
        'users:read',
        'users:create',
        'users:update',
        'users:delete',
        'questionnaires:read',
        'questionnaires:create',
        'questionnaires:update',
        'questionnaires:delete',
        'responses:read',
        'responses:create',
        'responses:update',
        'responses:delete',
        'expenses:read',
        'expenses:create',
        'expenses:update',
        'expenses:delete',
        'reports:read',
        'reports:create',
        'reports:update',
        'reports:delete',
      ],
      [UserRole.ADMIN]: [
        'users:read',
        'users:create',
        'users:update',
        'users:delete',
        'questionnaires:read',
        'questionnaires:create',
        'questionnaires:update',
        'questionnaires:delete',
        'responses:read',
        'responses:create',
        'responses:update',
        'responses:delete',
        'expenses:read',
        'expenses:create',
        'expenses:update',
        'expenses:delete',
        'reports:read',
        'reports:create',
        'reports:update',
        'reports:delete',
      ],
      [UserRole.USER]: [
        'questionnaires:read',
        'questionnaires:create',
        'responses:read',
        'responses:create',
        'expenses:read',
        'expenses:create',
        'reports:read',
        'reports:create',
      ],
    };

    return permissions[role] || [];
  }

  private canAssignRole(currentUserRole: UserRole, targetRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.SUPER_ADMIN]: [UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.ADMIN, UserRole.USER],
      [UserRole.ORGANIZATION_ADMIN]: [UserRole.ORGANIZATION_ADMIN, UserRole.ADMIN, UserRole.USER],
      [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.USER],
      [UserRole.USER]: [],
    };

    return roleHierarchy[currentUserRole]?.includes(targetRole) || false;
  }
}
