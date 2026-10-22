import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { CreateNoteDto } from './dto/notes.dto';
import { PersonalNote } from './entities/personal-note.entity';

type CurrentUser = { id?: string; organizationId?: string };

/** Notes are personal: every query is scoped to the author, never just the organization. */
@Injectable()
export class NotesService {
  constructor(@InjectRepository(PersonalNote) private readonly notes: Repository<PersonalNote>) {}

  private owner(user: CurrentUser) {
    if (!user?.organizationId || !user.id) throw apiError(ErrorCode.AuthOrganizationRequired);
    return { organizationId: user.organizationId, userId: user.id };
  }

  findMine(user: CurrentUser) {
    return this.notes.find({ where: this.owner(user), order: { createdAt: 'DESC' }, take: 1000 });
  }

  create(payload: CreateNoteDto, user: CurrentUser) {
    return this.notes.save(
      this.notes.create({
        ...this.owner(user),
        title: payload.title.trim(),
        content: payload.content?.trim() ?? '',
        tag: payload.tag?.trim() ?? '',
      }),
    );
  }

  /** Deletes the caller's own note. Somebody else's is "not found", not "forbidden". */
  async remove(id: string, user: CurrentUser) {
    const note = await this.notes.findOne({ where: { id, ...this.owner(user) } });
    if (!note) throw apiError(ErrorCode.ResourceNotFound, 'Note');
    await this.notes.softRemove(note);
    return { id, deleted: true };
  }
}
