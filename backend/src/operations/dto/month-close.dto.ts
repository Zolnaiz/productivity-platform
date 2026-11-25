/**
 * Closing a month that has ended, and reopening it with a reason.
 */
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';


/** The month to close, as YYYY-MM. */
export class CloseMonthDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month: string;
}

/** Why a closed month is opened again. Kept with the copy that was closed. */
export class ReopenMonthDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
