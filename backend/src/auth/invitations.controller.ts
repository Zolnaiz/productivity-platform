import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { AcceptInvitationDto, CreateInvitationDto } from './dto/invitation.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { RequirePermission } from '../shared/decorators/permissions.decorator';

interface AuthenticatedRequest {
  user?: { id?: string; organizationId?: string; role?: string };
}

@ApiTags('invitations')
@Controller('auth/invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('invitations:create')
  @Post()
  invite(@Body() body: CreateInvitationDto, @Request() request: AuthenticatedRequest) {
    return this.invitations.invite(body.email, body.role, request.user ?? {});
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('invitations:read')
  @Get()
  pending(@Request() request: AuthenticatedRequest) {
    return this.invitations.findPending(request.user ?? {});
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission('invitations:delete')
  @Delete(':id')
  revoke(@Param('id', new ParseUUIDPipe()) id: string, @Request() request: AuthenticatedRequest) {
    return this.invitations.revoke(id, request.user ?? {});
  }

  /**
   * What the accept screen shows before anyone has signed in.
   *
   * Public by necessity — the invitee has no account yet — so it returns only
   * the address the invitation was sent to and the role it grants.
   */
  @Get('token/:token')
  preview(@Param('token') token: string) {
    return this.invitations.preview(token);
  }

  @Post('token/:token/accept')
  accept(@Param('token') token: string, @Body() body: AcceptInvitationDto) {
    return this.invitations.accept(token, body);
  }
}
