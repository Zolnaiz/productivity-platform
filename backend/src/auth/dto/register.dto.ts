import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    example: 'Acme Inc.',
    description: 'Organization name',
  })
  @IsString()
  @MinLength(2)
  organizationName: string;

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
}