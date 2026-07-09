import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Notification,
  NotificationDocument,
} from './schema/notification.schema';
import { CreateNotificationInput } from './interface/notification.interface';

/** Event name the SSE stream listens on to push a notification to its recipient. */
export const NOTIFICATION_CREATED_EVENT = 'notification.created';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Persist a notification and push it to any live SSE connection for the
   * recipient. Never throws — notification delivery must not break the action
   * that triggered it.
   */
  async create(input: CreateNotificationInput): Promise<NotificationDocument | null> {
    try {
      const doc = await this.notificationModel.create({
        recipient: input.recipient,
        recipientType: input.recipientType,
        businessId: input.businessId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        metadata: input.metadata,
        read: false,
      });

      this.eventEmitter.emit(NOTIFICATION_CREATED_EVENT, {
        recipient: String(input.recipient),
        notification: doc.toObject(),
      });

      return doc;
    } catch (error) {
      this.logger.error(
        `Failed to create notification for ${input.recipient}: ${
          (error as Error)?.message
        }`,
      );
      return null;
    }
  }

  /** Fan a notification out to several recipients (e.g. all super admins). */
  async createMany(inputs: CreateNotificationInput[]): Promise<void> {
    await Promise.all(inputs.map((input) => this.create(input)));
  }

  /** Paginated bell list for a recipient, newest first. */
  async list(
    recipient: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  ) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(options.limit) || 20));
    const filter: Record<string, unknown> = { recipient };
    if (options.unreadOnly) {
      filter.read = false;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
      this.notificationModel.countDocuments({ recipient, read: false }).exec(),
    ]);

    return {
      items,
      unreadCount,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async unreadCount(recipient: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ recipient, read: false })
      .exec();
  }

  /** Mark one notification read — scoped to the recipient so users can't touch others'. */
  async markRead(recipient: string, id: string): Promise<void> {
    await this.notificationModel
      .updateOne(
        { _id: id, recipient, read: false },
        { $set: { read: true, readAt: new Date() } },
      )
      .exec();
  }

  async markAllRead(recipient: string): Promise<void> {
    await this.notificationModel
      .updateMany(
        { recipient, read: false },
        { $set: { read: true, readAt: new Date() } },
      )
      .exec();
  }

  /** Delete one notification — scoped to the recipient so users can't touch others'. */
  async remove(recipient: string, id: string): Promise<void> {
    await this.notificationModel.deleteOne({ _id: id, recipient }).exec();
  }

  /** Delete all of the recipient's read notifications (leaves unread intact). */
  async removeAllRead(recipient: string): Promise<void> {
    await this.notificationModel
      .deleteMany({ recipient, read: true })
      .exec();
  }
}
