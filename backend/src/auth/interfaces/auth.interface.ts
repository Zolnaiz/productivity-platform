export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  organizationId?: string;
  iat: number;
  exp: number;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId?: string;
    permissions: string[];
  };
  tokens: Tokens;
}

export interface RefreshTokenPayload {
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  resetToken?: string;
}