import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';

class FollowUpDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  /** Who does it. Left out, whoever walked. */
  @IsOptional()
  @IsString()
  assigneeId?: string;
}

export class CreateGembaWalkDto {
  /** The day walked, YYYY-MM-DD; left out, today. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  walkedOn?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observations?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  conversations?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => FollowUpDto)
  followUps?: FollowUpDto[];
}
