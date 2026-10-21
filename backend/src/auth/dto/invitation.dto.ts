import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UserRole } from '../../shared/constants';

export class CreateInvitationDto {
  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;
}

export class AcceptInvitationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password: string;
}

/** One spreadsheet row. Strings, not enums: a bad cell is reported per row, not refused whole. */
export class BulkInviteRowDto {
  @IsString()
  @MaxLength(320)
  email: string;

  @IsString()
  @MaxLength(40)
  role: string;
}

export class BulkInviteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BulkInviteRowDto)
  rows: BulkInviteRowDto[];

  /** Check only; invite nobody. */
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
