import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../shared/constants';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt: ${loginDto.email}`);
    const user = await this.validateUser(loginDto.email, loginDto.password);
    this.logger.log(`Login successful for user: ${user.email}`);
    return this.buildAuthResponse(user);
  }

  async register(registerDto: RegisterDto) {
    this.logger.log(`Registration attempt: ${registerDto.email}`);

    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const organization = await this.organizationsService.create({
      name: registerDto.organizationName,
      contactEmail: registerDto.email,
      phone: registerDto.phone,
      settings: {
        language: 'mn',
        timezone: 'Asia/Ulaanbaatar',
        currency: 'MNT',
        theme: 'light',
      },
      isActive: true,
    });

    const user = await this.usersService.create(
      {
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        email: registerDto.email,
        password: registerDto.password,
        role: UserRole.ADMIN,
        position: registerDto.position,
        phone: registerDto.phone,
        isActive: true,
      },
      organization.id,
    );

    user.organization = organization;
    this.logger.log(`User created: ${user.id}`);
    return this.buildAuthResponse(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret(),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user);
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Refresh token is invalid');
    }
  }

  async logout(userId: string) {
    this.logger.log(`Logout for user: ${userId}`);
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    await this.usersService.changePassword(userId, currentPassword, newPassword);
    return { message: 'Password changed successfully' };
  }

  async forgotPassword(email: string) {
    this.logger.log(`Forgot password for email: ${email}`);
    return {
      message: 'If this email is registered, password reset instructions will be sent',
    };
  }

  async resetPassword(_token: string, _password: string) {
    this.logger.log('Password reset requested');
    return { message: 'Password reset request accepted' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toAuthUser(user);
  }

  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      return null;
    }
  }

  private buildAuthResponse(user: User) {
    return {
      ...this.generateTokens(user),
      user: this.toAuthUser(user),
    };
  }

  private generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || user.organization?.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h') as any,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.refreshSecret(),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 604800,
    };
  }

  private toAuthUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId || user.organization?.id,
      organization: user.organization,
      avatarUrl: user.profileImageUrl,
      phoneNumber: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private refreshSecret() {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      `${this.configService.get<string>('JWT_SECRET', 'dev-secret-change-me')}-refresh`
    );
  }
}
