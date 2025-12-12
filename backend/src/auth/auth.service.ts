import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../shared/entities/user.entity';
import { Organization } from '../shared/entities/organization.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    this.logger.debug(`Validating user: ${email}`);

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['organization'],
    });

    if (!user) {
      this.logger.warn(`User not found: ${email}`);
      return null;
    }

    if (!user.isActive) {
      this.logger.warn(`User account inactive: ${email}`);
      throw new ForbiddenException('Таны акаунт идэвхгүй байна');
    }

    if (user.status !== 'active') {
      this.logger.warn(`User account not active: ${email}`);
      throw new ForbiddenException('Таны акаунт идэвхтэй бус байна');
    }

    if (user.isLocked()) {
      this.logger.warn(`User account locked: ${email}`);
      throw new ForbiddenException('Таны акаунт түгжэгдсэн байна');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      user.incrementLoginAttempts();
      await this.userRepository.save(user);
      
      this.logger.warn(`Invalid password for user: ${email}`);
      throw new UnauthorizedException('Имэйл эсвэл нууц үг буруу байна');
    }

    // Reset login attempts on successful login
    user.resetLoginAttempts();
    user.updateLastLogin();
    await this.userRepository.save(user);

    this.logger.log(`User validated successfully: ${email}`);
    return user;
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt: ${loginDto.email}`);

    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Имэйл эсвэл нууц үг буруу байна');
    }

    const tokens = await this.generateTokens(user);
    
    this.logger.log(`Login successful for user: ${user.email}`);
    
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        organization: user.organization,
        avatarUrl: user.avatarUrl,
        preferences: user.preferences,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    this.logger.log(`Registration attempt: ${registerDto.email}`);

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      this.logger.warn(`Email already exists: ${registerDto.email}`);
      throw new ConflictException('Энэ имэйл хаяг аль хэдийн бүртгэгдсэн байна');
    }

    // Check if username already exists
    const existingUsername = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUsername) {
      this.logger.warn(`Username already exists: ${registerDto.username}`);
      throw new ConflictException('Энэ хэрэглэгчийн нэр аль хэдийн бүртгэгдсэн байна');
    }

    // Find or create organization
    let organization = await this.organizationRepository.findOne({
      where: { code: registerDto.organizationCode },
    });

    if (!organization) {
      this.logger.log(`Creating new organization: ${registerDto.organizationCode}`);
      
      organization = this.organizationRepository.create({
        name: registerDto.organizationName || 'Шинэ байгууллага',
        code: registerDto.organizationCode,
        email: registerDto.email,
        settings: {
          language: 'mn',
          timezone: 'Asia/Ulaanbaatar',
          currency: 'MNT',
          theme: 'light',
        },
      });
      
      organization = await this.organizationRepository.save(organization);
      this.logger.log(`Organization created: ${organization.id}`);
    }

    // Check organization user limit
    const userCount = await this.userRepository.count({
      where: { organization: { id: organization.id } },
    });

    if (userCount >= organization.maxUsers) {
      this.logger.warn(`Organization user limit reached: ${organization.id}`);
      throw new ConflictException('Байгууллагын хэрэглэгчийн хязгаар хэтэрсэн байна');
    }

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      username: registerDto.username,
      password: registerDto.password,
      fullName: registerDto.fullName,
      role: registerDto.role || 'user',
      organization: organization,
      preferences: {
        language: 'mn',
        theme: 'light',
        notifications: true,
      },
    });

    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User created: ${savedUser.id}`);

    const tokens = await this.generateTokens(savedUser);

    return {
      ...tokens,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        username: savedUser.username,
        fullName: savedUser.fullName,
        role: savedUser.role,
        organization: savedUser.organization,
      },
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    this.logger.log('Refresh token attempt');

    try {
      const payload = this.jwtService.verify(refreshTokenDto.refresh_token, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '-refresh',
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['organization'],
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Хэрэглэгч олдсонгүй эсвэл идэвхгүй байна');
      }

      const tokens = await this.generateTokens(user);
      this.logger.log(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Refresh token хүчингүй байна');
    }
  }

  async logout(userId: string) {
    this.logger.log(`Logout for user: ${userId}`);
    
    // In a real application, you might want to:
    // 1. Add token to blacklist
    // 2. Clear refresh token from database
    // 3. Log the logout event
    
    return { message: 'Амжилттай гарлаа' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    this.logger.log(`Change password for user: ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Хэрэглэгч олдсонгүй');
    }

    const isValidPassword = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Одоогийн нууц үг буруу байна');
    }

    user.password = changePasswordDto.newPassword;
    await this.userRepository.save(user);

    this.logger.log(`Password changed successfully for user: ${userId}`);
    
    return { message: 'Нууц үг амжилттай солигдлоо' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(`Forgot password for email: ${forgotPasswordDto.email}`);

    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist
      this.logger.warn(`User not found for forgot password: ${forgotPasswordDto.email}`);
      return { message: 'Хэрэв энэ имэйл бүртгэлтэй бол нууц үг шинэчлэх заавар имэйлээр илгээгдэх болно' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    // In a real application, you would:
    // 1. Save reset token to database
    // 2. Send email with reset link
    
    this.logger.log(`Reset token generated for user: ${user.email}`);
    
    return { message: 'Нууц үг шинэчлэх заавар имэйлээр илгээгдэх болно' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    this.logger.log('Reset password attempt');

    // In a real application, you would:
    // 1. Verify reset token from database
    // 2. Check if token is expired
    // 3. Update user's password
    
    // For now, we'll just return a success message
    this.logger.log('Password reset successful');
    
    return { message: 'Нууц үг амжилттай шинэчлэгдлээ' };
  }

  async getProfile(userId: string) {
    this.logger.log(`Get profile for user: ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['organization'],
    });

    if (!user) {
      throw new UnauthorizedException('Хэрэглэгч олдсонгүй');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      organization: user.organization,
      avatarUrl: user.avatarUrl,
      phoneNumber: user.phoneNumber,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(userId: string, updateData: any) {
    this.logger.log(`Update profile for user: ${userId}`);

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Хэрэглэгч олдсонгүй');
    }

    // Update allowed fields
    if (updateData.fullName) user.fullName = updateData.fullName;
    if (updateData.phoneNumber) user.phoneNumber = updateData.phoneNumber;
    if (updateData.avatarUrl) user.avatarUrl = updateData.avatarUrl;
    if (updateData.preferences) {
      user.preferences = { ...user.preferences, ...updateData.preferences };
    }

    await this.userRepository.save(user);
    this.logger.log(`Profile updated for user: ${userId}`);

    return this.getProfile(userId);
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION || '7d',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '-refresh',
        expiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 604800, // 7 days in seconds
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      return null;
    }
  }
}