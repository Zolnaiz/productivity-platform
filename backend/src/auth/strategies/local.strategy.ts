import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { apiError, ErrorCode } from '../../shared/errors/api-error';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    
    if (!user) {
      throw apiError(ErrorCode.AuthInvalidCredentials);
    }

    if (!user.isActive) {
      throw apiError(ErrorCode.AuthAccountInactive);
    }

    return user;
  }
}