import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../shared/constants';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { MAILER, Mailer } from '../shared/mail/mailer';
import { mailLanguageOf } from '../shared/mail/wording';
import { createInvitationToken, hashInvitationToken, hashesMatch, normalizeEmail } from './invitation-token';
import {
  PASSWORD_RESET_COOLDOWN_MS,
  PASSWORD_RESET_TTL_MS,
  passwordResetMail,
} from './password-reset-mail';

const durationToSeconds = (duration: string) => {
  const match = duration.trim().match(/^(\d+)([smhd])?$/);

  if (!match) {
    return undefined;
  }

  const value = Number(match[1]);
  const unit = match[2] || 's';
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return value * multipliers[unit];
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(MAILER) private readonly mailer: Mailer,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.validateUser(email, password);

    if (!user) {
      throw apiError(ErrorCode.AuthInvalidCredentials);
    }

    if (!user.isActive) {
      throw apiError(ErrorCode.AuthAccountInactive);
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
      throw apiError(ErrorCode.AuthEmailTaken);
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
        // Whoever registers a workspace owns it. As `admin` they could not
        // open its settings - its time zone, language and close day - and
        // could not appoint a second administrator, since nobody may hand
        // out their own level.
        role: UserRole.ORGANIZATION_ADMIN,
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
      // Issued before the last password change or reset: that session is over.
      if (!user || !user.isActive || (payload.ver ?? 0) !== (user.tokenVersion ?? 0)) {
        throw apiError(ErrorCode.AuthSessionExpired);
      }

      return this.buildAuthResponse(user);
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw apiError(ErrorCode.AuthSessionExpired);
    }
  }

  async logout(userId: string) {
    this.logger.log(`Logout for user: ${userId}`);
    return { message: 'Logged out successfully' };
  }

  /**
   * Changes the password and ends every other session. The device that
   * changed it gets a new session with the answer, so it stays signed in.
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.changePassword(userId, currentPassword, newPassword);
    return { message: 'Password changed successfully', ...this.buildAuthResponse(user) };
  }

  /**
   * Starts a password reset.
   *
   * The answer is the same whether or not the address belongs to anyone, so
   * the form cannot be used to find out who has an account. Only the hash of
   * the token is stored; the raw token exists in the email alone.
   */
  async forgotPassword(email: string) {
    const answer = {
      message: 'If this email is registered, password reset instructions will be sent',
    };
    const user = await this.usersService.findByEmail(normalizeEmail(email));

    if (!user || !user.isActive) {
      return answer;
    }

    // Issued less than a cooldown ago: the earlier mail is still on its way.
    const issuedAt = user.resetPasswordExpires
      ? new Date(user.resetPasswordExpires).getTime() - PASSWORD_RESET_TTL_MS
      : 0;
    if (Date.now() - issuedAt < PASSWORD_RESET_COOLDOWN_MS) {
      return answer;
    }

    // Not awaited: storing the token and talking to SMTP take time an
    // unknown address does not, and that difference would reveal which
    // addresses are registered.
    void this.issuePasswordReset(user);

    return answer;
  }

  private async issuePasswordReset(user: User) {
    const token = createInvitationToken();

    try {
      await this.usersService.setResetToken(
        user.id,
        hashInvitationToken(token),
        new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      );
      const language =
        (user.language === 'mn' || user.language === 'en' ? user.language : undefined) ??
        mailLanguageOf(user.organization?.settings) ??
        'mn';
      await this.mailer.send({
        to: user.email,
        ...passwordResetMail(language, token, this.configService.get<string>('APP_BASE_URL') ?? ''),
      });
    } catch {
      // The request can be repeated; nothing about the failure reaches the caller.
      this.logger.warn(`Could not issue a password reset for user ${user.id}`);
    }
  }

  /** Sets a new password from a reset token. Wrong, expired and used tokens are indistinguishable. */
  async resetPassword(token: string, password: string) {
    const tokenHash = hashInvitationToken(token);
    const user = await this.usersService.findByResetToken(tokenHash);

    if (
      !user ||
      !user.resetPasswordToken ||
      !hashesMatch(user.resetPasswordToken, tokenHash) ||
      !user.resetPasswordExpires ||
      new Date(user.resetPasswordExpires).getTime() <= Date.now() ||
      !user.isActive
    ) {
      throw apiError(ErrorCode.PasswordResetInvalid);
    }

    // Consumed conditionally: of two requests racing with one token, only the
    // one whose write still finds the token in place wins.
    if (!(await this.usersService.completePasswordReset(user.id, tokenHash, password))) {
      throw apiError(ErrorCode.PasswordResetInvalid);
    }
    this.logger.log(`Password reset completed for user ${user.id}`);

    return { message: 'Password has been reset' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw apiError(ErrorCode.AuthUserNotFound);
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
    const accessTokenExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1h');
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || user.organization?.id,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn as any,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, ver: user.tokenVersion ?? 0 },
      {
        secret: this.refreshSecret(),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any,
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: durationToSeconds(accessTokenExpiresIn) || 3600,
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
      language: user.language ?? undefined,
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
