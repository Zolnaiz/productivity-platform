import { BadRequestException, Body, Controller, Get, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { CheckinsService } from './checkins.service';
import { SaveCheckinDto } from './dto/checkins.dto';
import { OperationsAuthGuard } from './guards/operations-auth.guard';

const isDay = (value?: string): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

@ApiTags('checkins')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}

  @Get('mine')
  @RequirePermission('checkins:write')
  @ApiOperation({ summary: 'My check-in for the week a day falls in' })
  findMine(@Query('week') week: string, @Request() req) {
    if (!isDay(week)) throw new BadRequestException('week must be a day, YYYY-MM-DD');
    return this.checkins.findMine(week, req.user);
  }

  @Put('mine')
  @RequirePermission('checkins:write')
  @ApiOperation({ summary: 'Write or update my check-in for a week' })
  saveMine(@Body() body: SaveCheckinDto, @Request() req) {
    return this.checkins.saveMine(body, req.user);
  }

  @Get()
  @RequirePermission('checkins:team')
  @ApiOperation({ summary: 'Everybody’s check-ins for a week' })
  findTeam(@Query('week') week: string, @Request() req) {
    if (!isDay(week)) throw new BadRequestException('week must be a day, YYYY-MM-DD');
    return this.checkins.findTeam(week, req.user);
  }
}
