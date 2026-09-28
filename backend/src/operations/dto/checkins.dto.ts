import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const WEEK = /^\d{4}-\d{2}-\d{2}$/;

export class SaveCheckinDto {
  /** The Monday of the week, YYYY-MM-DD. Any other day is moved to its Monday. */
  @Matches(WEEK)
  week: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  progress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  plans?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  problems?: string;
}
