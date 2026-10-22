import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { CreateFocusSessionDto } from './dto/focus.dto';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { PersonalService } from './personal.service';

@ApiTags('personal')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller()
export class PersonalController {
  constructor(private readonly personal: PersonalService) {}

  @Get('focus-sessions')
  @RequirePermission('personal:own')
  @ApiOperation({ summary: 'Your own focus sessions' })
  focusSessions(@Request() req) {
    return this.personal.focusSessions(req.user);
  }

  @Post('focus-sessions')
  @RequirePermission('personal:own')
  @ApiOperation({ summary: 'Record a finished focus session' })
  addFocusSession(@Body() body: CreateFocusSessionDto, @Request() req) {
    return this.personal.addFocusSession(body, req.user);
  }

  @Get('badges')
  @RequirePermission('personal:own')
  @ApiOperation({ summary: 'Badges your own records earn, with progress' })
  badges(@Request() req) {
    return this.personal.badges(req.user);
  }
}
