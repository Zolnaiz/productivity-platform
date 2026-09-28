import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IdeaStatus } from '../entities/idea.entity';

export class CreateIdeaDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  benefit?: string;
}

/** A decision on an idea, and - when it is taken up - who puts it in place. */
export class ReviewIdeaDto {
  @IsIn([IdeaStatus.APPROVED, IdeaStatus.DECLINED, IdeaStatus.DONE])
  status: IdeaStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  /** Who does the work. Left out, it is the person who had the idea. */
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
