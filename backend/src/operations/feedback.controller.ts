import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { FeedbackService } from './feedback.service';
import { OperationsAuthGuard } from './guards/operations-auth.guard';

@ApiTags('feedback')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Post()
  @RequirePermission('feedback:create')
  @ApiOperation({ summary: 'Report a fault, suggest a change or ask a question about the product' })
  create(@Body() body: CreateFeedbackDto, @Request() req) {
    return this.feedback.create(body, req.user);
  }

  @Get()
  @RequirePermission('feedback:read')
  @ApiOperation({ summary: 'The organization’s feedback, newest first' })
  findAll(@Request() req) {
    return this.feedback.findAll(req.user);
  }

  @Patch(':id/read')
  @RequirePermission('feedback:read')
  @ApiOperation({ summary: 'Mark a feedback message as read' })
  markRead(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    return this.feedback.markRead(id, req.user);
  }
}
