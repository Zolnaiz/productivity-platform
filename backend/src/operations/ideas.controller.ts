import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { CreateIdeaDto, ReviewIdeaDto } from './dto/ideas.dto';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { IdeasService } from './ideas.service';

@ApiTags('ideas')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideas: IdeasService) {}

  @Get()
  @RequirePermission('ideas:read')
  @ApiOperation({ summary: 'The organization’s improvement ideas, newest first' })
  findAll(@Request() req) {
    return this.ideas.findAll(req.user);
  }

  @Post()
  @RequirePermission('ideas:create')
  @ApiOperation({ summary: 'Put an improvement idea in the box' })
  create(@Body() body: CreateIdeaDto, @Request() req) {
    return this.ideas.create(body, req.user);
  }

  @Patch(':id/review')
  @RequirePermission('ideas:review')
  @ApiOperation({ summary: 'Take an idea up, decline it, or mark it in place' })
  review(@Param('id') id: string, @Body() body: ReviewIdeaDto, @Request() req) {
    return this.ideas.review(id, body, req.user);
  }
}
