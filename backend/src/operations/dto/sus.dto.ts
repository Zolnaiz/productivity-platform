import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { SUS_ITEMS, SUS_MAX_ANSWER, SUS_MIN_ANSWER } from '../sus';

/** An administrator opening a round of the questionnaire. */
export class OpenSusRoundDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;
}

/** One person's answers: S1 … S10 in order, each a whole number from 1 to 5. */
export class SaveSusAnswersDto {
  @IsArray()
  @ArrayMinSize(SUS_ITEMS)
  @ArrayMaxSize(SUS_ITEMS)
  @IsInt({ each: true })
  @Min(SUS_MIN_ANSWER, { each: true })
  @Max(SUS_MAX_ANSWER, { each: true })
  answers: number[];
}
