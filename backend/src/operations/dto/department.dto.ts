/**
 * The organization's departments.
 */
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { OrganizationScopedDto } from './shared.dto';

export class CreateDepartmentDto extends OrganizationScopedDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  focusArea?: string;
}

export class UpdateDepartmentDto extends OrganizationScopedDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  focusArea?: string;
}
