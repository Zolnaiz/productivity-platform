import { BadRequestException, Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { CreateGembaWalkDto } from './dto/gemba.dto';
import { GembaService } from './gemba.service';
import { OperationsAuthGuard } from './guards/operations-auth.guard';

@ApiTags('gemba')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller('gemba')
export class GembaController {
  constructor(private readonly gemba: GembaService) {}

  @Get()
  @RequirePermission('gemba:walk')
  @ApiOperation({ summary: 'The week’s walks, and each manager’s count against the target' })
  week(@Query('week') week: string, @Request() req) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week ?? '')) throw new BadRequestException('week must be a day, YYYY-MM-DD');
    return this.gemba.week(week, req.user);
  }

  @Post()
  @RequirePermission('gemba:walk')
  @ApiOperation({ summary: 'Record a walk; its follow-ups become tasks' })
  record(@Body() body: CreateGembaWalkDto, @Request() req) {
    return this.gemba.record(body, req.user);
  }
}
