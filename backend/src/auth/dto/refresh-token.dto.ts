import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token. A browser in cookie mode sends none: the HttpOnly cookie carries it.',
    required: false,
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}