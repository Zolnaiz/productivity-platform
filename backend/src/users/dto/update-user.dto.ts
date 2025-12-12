import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../shared/constants';

export class UpdateUserDto {
  @ApiProperty({
    example: 'John',
    description: 'User first name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
    minLength: 6,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role',
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    example: 'Software Developer',
    description: 'User position',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'Profile image URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @ApiProperty({
    example: true,
    description: 'Whether user is active',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 'org_123',
    description: 'Organization ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  organizationId?: string;
}