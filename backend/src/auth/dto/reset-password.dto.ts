/**
 * Body of POST /auth/reset-password: the one-time token from the mail or admin link, and the new password.
 */
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}
