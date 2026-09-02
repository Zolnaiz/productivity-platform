import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Body } from '@nestjs/common';
import type { Response } from 'express';
import { AttachmentsService, UploadedAttachment } from './attachments.service';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { MAX_ATTACHMENT_BYTES, parseAttachmentTarget } from './attachment-storage';
import { apiError, ErrorCode } from '../shared/errors/api-error';

@ApiTags('attachments')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      // Held in memory so the bytes can be sniffed before anything is written.
      // The cap keeps that safe; a 5S photograph is well under it.
      limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 },
    }),
  )
  upload(
    @UploadedFile() file: UploadedAttachment | undefined,
    @Body() body: Record<string, unknown>,
    @Request() request: { user?: { id?: string; organizationId?: string } },
  ) {
    const target = parseAttachmentTarget(body.ownerType, body.ownerId, body.kind);
    const caption = typeof body.caption === 'string' ? body.caption : undefined;

    return this.attachments.upload(file, target, caption, request.user ?? {});
  }

  @Get()
  list(
    @Query('ownerType') ownerType: string,
    @Query('ownerId') ownerId: string,
    @Request() request: { user?: { id?: string; organizationId?: string } },
  ) {
    const target = parseAttachmentTarget(ownerType, ownerId, undefined);

    return this.attachments.findForOwner(target.ownerType, target.ownerId, request.user ?? {});
  }

  /**
   * Streams the bytes back.
   *
   * `Content-Disposition: attachment` and a locked-down CSP mean a stored PDF
   * or image is downloaded rather than rendered in this origin, so an upload
   * cannot become a script running against a signed-in session.
   */
  @Get(':id/file')
  @Header('Cache-Control', 'private, max-age=3600')
  @Header('Content-Security-Policy', "default-src 'none'; sandbox")
  @Header('X-Content-Type-Options', 'nosniff')
  async file(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() request: { user?: { id?: string; organizationId?: string } },
    @Res() response: Response,
  ) {
    const { attachment, buffer } = await this.attachments.read(id, request.user ?? {});

    response.setHeader('Content-Type', attachment.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
    );
    response.send(buffer);
  }

  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() request: { user?: { id?: string; organizationId?: string } },
  ) {
    return this.attachments.remove(id, request.user ?? {});
  }
}

/** Re-exported so the module can register the same limit multer enforces. */
export const attachmentTooLarge = () => apiError(ErrorCode.FileTooLarge);
