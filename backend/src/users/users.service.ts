/**
 * Team members of an organisation: list, create, update, change role (only to roles the actor may assign,
 * roles.ts), disable, and issue an admin password-reset link when mail is not available.
 */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole, PaginationParams } from '../shared/constants';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { canAssignRole, permissionsFor } from '../shared/roles';
import { createInvitationToken, hashInvitationToken } from '../auth/invitation-token';
import { PASSWORD_RESET_TTL_MS } from '../auth/password-reset-mail';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    // For APP_BASE_URL, so a reset link points at the address people reach
    // the system by, as the reset mail's does. Optional so a unit test can
    // build the service from a repository alone.
    @Optional() private readonly config?: ConfigService,
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

  async directory(organizationId?: string) {
    if (!organizationId) return [];

    const people = await this.usersRepository.find({
      where: { organizationId, isActive: true },
      order: { firstName: 'ASC', lastName: 'ASC' },
    });

    return people.map((person) => ({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      position: person.position,
      departmentId: person.departmentId,
      role: person.role,
      isActive: person.isActive,
    }));
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

    if (updateUserDto.language !== undefined) {
      user.language = updateUserDto.language || null;
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
      throw apiError(ErrorCode.AuthCurrentPasswordWrong);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    // Every other session ends: the reason to change a password is often
    // that somebody else may have it.
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    return this.usersRepository.save(user);
  }

  /** Stores the hash of a reset token. One live token per account: a new request replaces the old. */
  async setResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    await this.usersRepository.update(userId, {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: expiresAt,
    });
  }

  findByResetToken(tokenHash: string) {
    return this.usersRepository.findOne({ where: { resetPasswordToken: tokenHash } });
  }

  /**
   * Sets a new password and burns the reset token in one conditional write.
   *
   * The token hash and its expiry are part of the WHERE clause, so a second
   * request racing with the same token finds nothing to update. Returns
   * whether this call was the one that consumed it.
   */
  async completePasswordReset(userId: string, tokenHash: string, newPassword: string) {
    const result = await this.usersRepository.update(
      { id: userId, resetPasswordToken: tokenHash, resetPasswordExpires: MoreThan(new Date()) },
      {
        password: await bcrypt.hash(newPassword, 10),
        resetPasswordToken: null as unknown as undefined,
        resetPasswordExpires: null as unknown as undefined,
        tokenVersion: () => 'token_version + 1',
      },
    );

    return (result.affected ?? 0) === 1;
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

  /**
   * A password reset link an administrator hands over in person.
   *
   * The sign-in page's "forgot password" mails the link, and where mail is not
   * set up (MAIL_TRANSPORT=log, as on the pilot server) it reaches nobody:
   * somebody who forgot their password was locked out for good. This issues
   * the same token the mail would carry (AuthService.forgotPassword): only its
   * hash is stored, it lasts PASSWORD_RESET_TTL_MS, it works once, and a newer
   * one replaces it. The raw token is returned here, once, for the
   * administrator to pass on; it is never logged, and the audit trail records
   * request bodies, not answers.
   *
   * Not for yourself (your account page changes your password), not for an
   * inactive account, and not for anyone whose role you could not assign: an
   * administrator must not be able to take over the account above them.
   */
  async issuePasswordResetLink(id: string, currentUser: any) {
    const user = await this.findOne(id, currentUser);

    if (user.id === currentUser.id) {
      throw apiError(ErrorCode.ValidationFailed, 'id');
    }
    if (!canAssignRole(currentUser.role, user.role)) {
      throw apiError(ErrorCode.AccessDenied);
    }
    if (!user.isActive) {
      throw apiError(ErrorCode.AuthAccountInactive);
    }

    const token = createInvitationToken();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await this.setResetToken(user.id, hashInvitationToken(token), expiresAt);

    // The link the mail would carry (passwordResetMail); null where no public
    // address is configured, and the web then builds it from its own.
    const base = (this.config?.get<string>('APP_BASE_URL') ?? '').replace(/\/$/, '');
    return { token, expiresAt, link: base ? `${base}/reset-password/${token}` : null };
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
