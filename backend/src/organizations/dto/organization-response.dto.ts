import { ApiProperty } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty({
    example: 'org_123',
    description: 'Organization ID',
  })
  id: string;

  @ApiProperty({
    example: 'Acme Inc.',
    description: 'Organization name',
  })
  name: string;

  @ApiProperty({
    example: 'A leading technology company',
    description: 'Organization description',
  })
  description?: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'Organization logo URL',
  })
  logoUrl?: string;

  @ApiProperty({
    example: 'https://example.com',
    description: 'Organization website',
  })
  website?: string;

  @ApiProperty({
    example: 'contact@example.com',
    description: 'Organization contact email',
  })
  contactEmail?: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Organization phone number',
  })
  phone?: string;

  @ApiProperty({
    example: '123 Main St, City, Country',
    description: 'Organization address',
  })
  address?: string;

  @ApiProperty({
    example: ['questionnaire', 'expense_tracking', 'reporting'],
    description: 'Organization features',
  })
  features?: string[];

  @ApiProperty({
    example: {
      maxUsers: 100,
      maxQuestionnaires: 1000,
      maxStorage: 1073741824,
    },
    description: 'Organization settings',
  })
  settings?: Record<string, any>;

  @ApiProperty({
    example: true,
    description: 'Whether organization is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: 50,
    description: 'Number of users in organization',
  })
  userCount: number;

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
}