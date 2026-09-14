import { IsEnum } from 'class-validator';
import { UserRole } from '../../shared/constants';

export class ChangeRoleDto {
  /**
   * Validated as an enum member, so an arbitrary string cannot reach the
   * role hierarchy check and rely on it to reject the value.
   */
  @IsEnum(UserRole)
  role: UserRole;
}
