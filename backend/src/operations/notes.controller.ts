import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../shared/decorators/permissions.decorator';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { CreateNoteDto } from './dto/notes.dto';
import { OperationsAuthGuard } from './guards/operations-auth.guard';
import { NotesService } from './notes.service';

@ApiTags('notes')
@ApiBearerAuth()
@UseGuards(OperationsAuthGuard, PermissionsGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  @RequirePermission('notes:own')
  @ApiOperation({ summary: 'Your own notes, newest first' })
  findMine(@Request() req) {
    return this.notes.findMine(req.user);
  }

  @Post()
  @RequirePermission('notes:own')
  @ApiOperation({ summary: 'Write a note' })
  create(@Body() body: CreateNoteDto, @Request() req) {
    return this.notes.create(body, req.user);
  }

  @Delete(':id')
  @RequirePermission('notes:own')
  @ApiOperation({ summary: 'Delete one of your notes' })
  remove(@Param('id', new ParseUUIDPipe()) id: string, @Request() req) {
    return this.notes.remove(id, req.user);
  }
}
