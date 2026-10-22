import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { apiError, ErrorCode } from '../shared/errors/api-error';
import { CreateFeedbackDto } from './dto/feedback.dto';
import { FeedbackMessage } from './entities/feedback.entity';

type CurrentUser = { id?: string; organizationId?: string };

@Injectable()
export class FeedbackService {
  constructor(@InjectRepository(FeedbackMessage) private readonly messages: Repository<FeedbackMessage>) {}

  private organizationOf(user: CurrentUser) {
    if (!user?.organizationId) throw apiError(ErrorCode.AuthOrganizationRequired);
    return user.organizationId;
  }

  create(payload: CreateFeedbackDto, user: CurrentUser) {
    return this.messages.save(
      this.messages.create({
        organizationId: this.organizationOf(user),
        authorId: user.id ?? '',
        kind: payload.kind,
        message: payload.message.trim(),
        page: payload.page?.trim() ?? '',
      }),
    );
  }

  /** The organization's feedback, newest first. */
  findAll(user: CurrentUser) {
    return this.messages.find({
      where: { organizationId: this.organizationOf(user) },
      order: { createdAt: 'DESC' },
      take: 500,
    });
  }

  async markRead(id: string, user: CurrentUser) {
    const message = await this.messages.findOne({ where: { id, organizationId: this.organizationOf(user) } });
    if (!message) throw apiError(ErrorCode.ResourceNotFound, 'Feedback');
    message.readAt = message.readAt ?? new Date();
    return this.messages.save(message);
  }
}
