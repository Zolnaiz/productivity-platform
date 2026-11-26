import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { OpenSusRoundDto, SaveSusAnswersDto } from './dto/sus.dto';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { SusService } from './sus.service';

/**
 * The SUS questionnaire (measure K7). Answering is everybody's
 * (`sus:answer`); opening, closing and reading the totals is an
 * administrator's (`sus:manage`).
 */
@ApiTags('sus')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller('sus')
export class SusController {
  constructor(private readonly sus: SusService) {}

  @Get('current')
  @RequirePermission('sus:answer')
  @ApiOperation({ summary: 'The open questionnaire, if any, and my answers to it' })
  current(@Request() req) {
    return this.sus.current(req.user);
  }

  @Put('rounds/:id/answers/mine')
  @RequirePermission('sus:answer')
  @ApiOperation({ summary: 'Answer the open questionnaire, or change my answers' })
  answer(@Param('id', new ParseUUIDPipe()) id: string, @Body() body: SaveSusAnswersDto, @Request() req) {
    return this.sus.answer(id, body.answers, req.user);
  }

  @Get('rounds')
  @RequirePermission('sus:manage')
  @ApiOperation({ summary: 'Every round, newest first, with its totals' })
  list(@Request() req) {
    return this.sus.list(req.user);
  }

  @Post('rounds')
  @RequirePermission('sus:manage')
  @ApiOperation({ summary: 'Open a round; refused while another is open' })
  open(@Body() body: OpenSusRoundDto, @Request() req) {
    return this.sus.open(body.title, req.user);
  }

  @Post('rounds/:id/close')
  @RequirePermission('sus:manage')
  @ApiOperation({ summary: 'Close a round to answers' })
  close(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    return this.sus.close(id, req.user);
  }

  @Get('rounds/:id/results')
  @RequirePermission('sus:manage')
  @ApiOperation({ summary: 'What one round comes to: totals, from three respondents up' })
  results(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    return this.sus.results(id, req.user);
  }
}
