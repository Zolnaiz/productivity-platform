import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

type JwtPayload = {
  sub?: string;
  id?: string;
  email?: string;
  role?: string;
  organizationId?: string;
  orgId?: string;
  permissions?: string[];
};

type RequestWithUser = Request & {
  user?: {
    id?: string;
    email?: string;
    role?: string;
    organizationId?: string;
    permissions: string[];
  };
};

const toBoolean = (value: unknown) => value === true || String(value).toLowerCase() === 'true';

@Injectable()
export class OperationsAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const allowPublicOperations = toBoolean(this.configService.get('ALLOW_PUBLIC_OPERATIONS'));
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      if (allowPublicOperations) {
        return true;
      }

      throw new UnauthorizedException('Bearer token is required');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      request.user = {
        id: payload.sub || payload.id,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId || payload.orgId,
        permissions: payload.permissions || [],
      };

      if (!request.user.organizationId && !allowPublicOperations) {
        throw new UnauthorizedException('Organization context is required');
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
