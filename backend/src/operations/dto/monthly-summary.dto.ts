import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const MONTH = /^\d{4}-\d{2}$/;

export class DraftSummaryDto {
  @Matches(MONTH)
  month: string;

  /** The language the draft is written in: the reader's. */
  @IsOptional()
  @IsIn(['mn', 'en'])
  language?: 'mn' | 'en';
}

export class SaveSummaryDto {
  @Matches(MONTH)
  month: string;

  @IsString()
  @MaxLength(8000)
  text: string;

  @IsOptional()
  @IsBoolean()
  approve?: boolean;
}
