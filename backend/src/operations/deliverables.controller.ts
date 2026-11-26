/**
 * /tasks/:id/deliverables - a task's work documents and their review (PLAN_V2 M2):
 *   GET                     the review state and the files, newest version first      (tasks:read)
 *   POST (multipart file)   add a document or photo                                    (deliverables:create)
 *   DELETE :attachmentId    remove one, before review or after a return               (deliverables:create)
 *   POST submit             send for review                                            (deliverables:create)
 *   POST approve            approve; finishes the task                                 (deliverables:review)
 *   POST return {note}      send back with a reason                                    (deliverables:review)
 * Downloads use GET /attachments/:id/file like every other file. Rules: deliverables.ts.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { MAX_ATTACHMENT_BYTES } from './attachment-storage';
import { UploadedAttachment } from './attachments.service';
import { DeliverablesService } from './deliverables.service';
import { OperationsAuthGuard } from './guards/operations-auth.guard';

@ApiTags('deliverables')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller('tasks/:id/deliverables')
export class DeliverablesController {
  constructor(private readonly deliverables: DeliverablesService) {}

  @Get()
  @RequirePermission('tasks:read')
  @ApiOperation({ summary: 'The review state and the files of a task' })
  list(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    return this.deliverables.list(id, req.user);
  }

  @Post()
  @RequirePermission('deliverables:create')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 } }))
  @ApiOperation({ summary: 'Add a document or photo (PDF, image, Word, Excel, PowerPoint)' })
  upload(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: UploadedAttachment | undefined,
    @Body() body: Record<string, unknown>,
    @Request() req,
  ) {
    const caption = typeof body?.caption === 'string' ? body.caption : undefined;
    return this.deliverables.upload(id, file, caption, req.user);
  }

  @Delete(':attachmentId')
  @RequirePermission('deliverables:create')
  @ApiOperation({ summary: 'Remove a file, while the documents are not under review or approved' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('attachmentId', new ParseUUIDPipe()) attachmentId: string,
    @Request() req,
  ) {
    return this.deliverables.removeFile(id, attachmentId, req.user);
  }

  @Post('submit')
  @RequirePermission('deliverables:create')
  @ApiOperation({ summary: 'Send the documents for review' })
  submit(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    return this.deliverables.submit(id, req.user);
  }

  @Post('approve')
  @RequirePermission('deliverables:review')
  @ApiOperation({ summary: 'Approve the documents; the task is finished' })
  approve(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    return this.deliverables.approve(id, req.user);
  }

  @Post('return')
  @RequirePermission('deliverables:review')
  @ApiOperation({ summary: 'Return the documents with a reason' })
  returnForChanges(@Param('id', new ParseUUIDPipe()) id: string, @Body() body: { note?: string }, @Request() req) {
    return this.deliverables.returnForChanges(id, typeof body?.note === 'string' ? body.note : undefined, req.user);
  }
}
