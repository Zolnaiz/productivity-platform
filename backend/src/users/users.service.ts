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
import { canAssignRole, permissionsFor } from '../shared/roles';

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
    // Callers inside the application pass a plain object; the controller
    // passes a validated DTO. Defaulting here keeps an undefined page from
    // turning the offset into NaN and returning an empty list.
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const { search, role } = params;
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
      // ILIKE, not LIKE: PostgreSQL compares case-sensitively, so searching
      // for a colleague by the lower-case start of their name found nobody.
      query.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
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

  /**
   * The details of a member. Nothing here decides what they can do.
   *
   * `UpdateUserDto` deliberately has no `role`, `organizationId`, `isActive`
   * or `password`; this list is the second lock, because the service is also
   * called from inside the application where no validation pipe runs. A field
   * reaching here that is not on the list is ignored rather than assigned.
   */
  private static readonly editableFields = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'position',
    'profileImageUrl',
  ] as const;

  private async applyEdit(user: User, updateUserDto: UpdateUserDto) {
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== user.id) {
        throw new ConflictException('Email already in use');
      }
    }

    for (const field of UsersService.editableFields) {
      const value = updateUserDto[field];
      if (value !== undefined) {
        user[field] = value;
      }
    }

    return this.usersRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: any) {
    const user = await this.findOne(id, currentUser);

    return this.applyEdit(user, updateUserDto);
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.applyEdit(user, updateUserDto);
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

  /**
   * Puts a removed member back.
   *
   * `remove` soft-deletes, and TypeORM hides soft-deleted rows from every
   * ordinary find — so looking the member up the usual way reported them as
   * missing and there was no way back in. The row has to be asked for
   * explicitly, and the delete mark cleared along with the flag.
   */
  async activate(id: string, currentUser: any) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['organization'],
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.checkUserAccess(user, currentUser);

    user.isActive = true;
    user.deletedAt = null;
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

  /**
   * Moves a member to another role.
   *
   * Three things have to hold: you are not editing yourself, the role you are
   * granting is one you may grant, and the role the member holds *now* is one
   * you may grant. The last is the one that is easy to miss — without it an
   * administrator could not promote a colleague past themselves but could
   * demote the person above them, which comes to the same thing.
   */
  async changeRole(id: string, role: UserRole, currentUser: any) {
    const user = await this.findOne(id, currentUser);

    if (user.id === currentUser.id) {
      throw new ForbiddenException('Cannot change your own role');
    }

    if (!canAssignRole(currentUser.role, role)) {
      throw new ForbiddenException('You cannot assign this role');
    }

    if (!canAssignRole(currentUser.role, user.role)) {
      throw new ForbiddenException('You cannot change this role');
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

    // Anybody may reach their own record, whatever their role. Checking for
    // one specific role here locked managers and viewers out of themselves.
    if (user.id === currentUser.id) {
      return;
    }

    throw new ForbiddenException('Access denied');
  }

  /**
   * What this role may do.
   *
   * The list comes from `shared/roles.ts`, which is also what
   * `PermissionsGuard` enforces — so the capabilities the client is told about
   * are the same ones the server will actually allow. Before, this was a
   * hand-written second list that named questionnaires and responses, modules
   * this system does not have.
   */
  private getRolePermissions(role: UserRole): string[] {
    return permissionsFor(role);
  }
}
