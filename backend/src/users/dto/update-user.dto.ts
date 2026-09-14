import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * What editing a member may change.
 *
 * Everything that decides what somebody can *do* is deliberately absent:
 *
 * - `role` belongs to `POST /users/:id/change-role`, which checks the role
 *   hierarchy. When it lived here, `PATCH /users/:id` skipped that check, and
 *   since anybody may edit their own record, any signed-in account could
 *   promote itself to super admin in one request.
 * - `organizationId` belongs to the invitation that placed the member. Editing
 *   it moved a person — or the caller — into another tenant.
 * - `isActive` belongs to `POST /users/:id/activate` and `/deactivate`, which
 *   refuse to act on the caller themselves.
 * - `password` belongs to `POST /auth/change-password`, which proves the
 *   current one first. Setting it here let an administrator take over an
 *   account silently.
 *
 * The global validation pipe runs with `forbidNonWhitelisted`, so sending any
 * of them is a 400 rather than a field that is quietly dropped.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Бат' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Дорж' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Үйлдвэрлэлийн инженер' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ example: '+97699112233' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  profileImageUrl?: string;
}
