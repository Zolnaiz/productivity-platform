import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { FeedbackKind } from '../entities/feedback.entity';

export class CreateFeedbackDto {
  @IsEnum(FeedbackKind)
  kind: FeedbackKind;

  @IsString()
  @MinLength(5)
  @MaxLength(4000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  page?: string;
}
