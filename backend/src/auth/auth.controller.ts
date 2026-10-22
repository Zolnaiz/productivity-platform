import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../shared/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { clearRefreshCookie, deliverSession, readRefreshCookie } from './session-cookie';
import { apiError, ErrorCode } from '../shared/errors/api-error';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /** Secure cookies in production, where the site is served over HTTPS. */
  private get secureCookies() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Request() req, @Res({ passthrough: true }) res) {
    return deliverSession(req, res, await this.authService.register(registerDto), this.secureCookies);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Request() req, @Res({ passthrough: true }) res) {
    return deliverSession(req, res, await this.authService.login(loginDto), this.secureCookies);
  }

  /** The refresh token comes in the body (the phone) or the HttpOnly cookie (the browser). */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto, @Request() req, @Res({ passthrough: true }) res) {
    const token = refreshTokenDto?.refreshToken || readRefreshCookie(req);
    if (!token) throw apiError(ErrorCode.AuthSessionExpired);

    return deliverSession(req, res, await this.authService.refreshToken(token), this.secureCookies);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req, @Res({ passthrough: true }) res) {
    clearRefreshCookie(res, this.secureCookies);
    return this.authService.logout(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  // Tighter than the global limit: this endpoint sends mail and guesses tokens.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }
}
