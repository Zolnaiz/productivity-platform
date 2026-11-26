/**
 * Shared by every operations DTO: the organization scope a request may name, and the
 * rule that an empty optional date is no date.
 */
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';


/**
 * An optional date left empty is no date.
 *
 * A form's empty date field arrives as "", which is not an ISO date, so a
 * project created without a due date was refused outright.
 */
export const EmptyIsAbsent = () => Transform(({ value }) => (value === '' ? undefined : value));

export class OrganizationScopedDto {
  @IsOptional()
  @IsString()
  organizationId?: string;
}
