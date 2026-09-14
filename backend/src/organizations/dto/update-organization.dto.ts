import { IsString, MinLength, MaxLength, IsOptional, IsBoolean, IsUrl, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * What an organization may change about itself.
 *
 * `isActive` and `features` are absent on purpose. Nothing reads either one
 * today, but they are the organization-level equivalent of putting `role` in
 * the user edit DTO: one decides whether the tenant exists, the other what it
 * is entitled to, and the tenant is the last party who should set them. With
 * the cross-organization routes gone there is also no way back from an
 * organization deactivating itself.
 *
 * `settings` stays — timezone, language and the close day are the
 * organization's own business.
 */
export class UpdateOrganizationDto {
  @ApiProperty({
    example: 'Acme Inc.',
    description: 'Organization name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    example: 'A leading technology company',
    description: 'Organization description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'Organization logo URL',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({
    example: 'https://example.com',
    description: 'Organization website',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({
    example: 'contact@example.com',
    description: 'Organization contact email',
    required: false,
  })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Organization phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: '123 Main St, City, Country',
    description: 'Organization address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;


  @ApiProperty({
    example: {
      maxUsers: 100,
      maxQuestionnaires: 1000,
      maxStorage: 1073741824, // 1GB in bytes
    },
    description: 'Organization settings',
    required: false,
  })
  @IsOptional()
  settings?: Record<string, any>;

}