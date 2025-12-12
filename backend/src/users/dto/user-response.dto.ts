import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../shared/constants';

export class UserResponseDto {
  @ApiProperty({
    example: 'user_123',
    description: 'User ID',
  })
  id: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  lastName: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role',
  })
  role: UserRole;

  @ApiProperty({
    example: 'Software Developer',
    description: 'User position',
  })
  position?: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number',
  })
  phone?: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'Profile image URL',
  })
  profileImageUrl?: string;

  @ApiProperty({
    example: true,
    description: 'Whether user is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: 'org_123',
    description: 'Organization ID',
  })
  organizationId?: string;

  @ApiProperty({
    example: 'Acme Inc.',
    description: 'Organization name',
  })
  organizationName?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last login timestamp',
    required: false,
  })
  lastLogin?: Date;
}