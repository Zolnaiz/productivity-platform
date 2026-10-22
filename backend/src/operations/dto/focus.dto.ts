import { IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateFocusSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsNumber()
  @Min(1)
  @Max(600)
  minutes: number;

  /** YYYY-MM-DD; left out, today on the organization's calendar. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
