/**
 * Body of POST /auth/forgot-password: the e-mail address to send a reset link to.
 */
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
