import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import { Model, Types } from 'mongoose';
import {
  BusinessCustomer,
  BusinessCustomerDocument,
} from '../../business/schema/business.schema';
import { JOB_NAMES, QUEUE_NAMES } from '../../jobs/constants';
import { paginationUtil } from '../../utils/pagination';
import { successResponse } from '../../utils/responses';
import {
  AdminMessageQueryDto,
  CreateAdminMessageDto,
  UpdateAdminAlertDto,
} from './dto/message.dto';
import {
  AdminMessageAudience,
  AdminMessageStatus,
  AdminMessageType,
} from './enum/message.enum';
import type { AdminMessageEmailJob } from './messaging-email.processor';
import { AdminMessage, AdminMessageDocument } from './schema/message.schema';

@Injectable()
export class AdminMessagingService {
  constructor(
    @InjectModel(AdminMessage.name)
    private readonly messageModel: Model<AdminMessageDocument>,
    @InjectModel(BusinessCustomer.name)
    private readonly customerModel: Model<BusinessCustomerDocument>,
    @InjectQueue(QUEUE_NAMES.ADMIN_MESSAGING_EMAIL)
    private readonly emailQueue: Queue<AdminMessageEmailJob>,
  ) {}

  async create(dto: CreateAdminMessageDto, adminId?: string) {
    this.validateDateRange(dto.startDate, dto.endDate);

    if (dto.type === AdminMessageType.ALERT) {
      const hasActiveAlert = await this.messageModel.exists({
        type: AdminMessageType.ALERT,
        status: AdminMessageStatus.ACTIVE,
      });

      const alert = await this.messageModel.create({
        type: dto.type,
        message: dto.message.trim(),
        theme: dto.theme,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        status: hasActiveAlert
          ? AdminMessageStatus.INACTIVE
          : AdminMessageStatus.ACTIVE,
        audience: AdminMessageAudience.ALL,
        createdBy: this.toOptionalObjectId(adminId),
      });

      return successResponse('Message created successfully', alert);
    }

    const { recipients, audience } = await this.resolveRecipients(dto.users);
    const email = await this.messageModel.create({
      type: AdminMessageType.EMAIL,
      message: dto.message.trim(),
      subject: dto.subject.trim(),
      users: recipients.map((recipient) => recipient._id),
      status: AdminMessageStatus.PENDING,
      audience,
      recipientCount: recipients.length,
      createdBy: this.toOptionalObjectId(adminId),
    });

    await this.enqueueEmail(email, recipients);
    return successResponse('Message queued successfully', email);
  }

  async findAll(query: AdminMessageQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    const result = await paginationUtil.paginate<AdminMessageDocument>({
      model: this.messageModel,
      page: query.page,
      limit: query.limit,
      filter,
      search: query.search?.trim(),
      searchFields: ['message', 'subject'],
      sort: {
        [query.sortBy || 'createdAt']: query.sortOrder === 'asc' ? 1 : -1,
      },
    });

    return successResponse('Messages fetched successfully', {
      messages: result.data,
      meta: result.meta,
    });
  }

  async getStats() {
    const [totalMessages, alertMessages, emailMessages] = await Promise.all([
      this.messageModel.countDocuments(),
      this.messageModel.countDocuments({ type: AdminMessageType.ALERT }),
      this.messageModel.countDocuments({ type: AdminMessageType.EMAIL }),
    ]);

    return successResponse('Stats fetched successfully', {
      totalMessages,
      alertMessages,
      emailMessages,
    });
  }

  async getActiveAlert() {
    const now = new Date();
    const alert = await this.messageModel
      .findOne({
        type: AdminMessageType.ALERT,
        status: AdminMessageStatus.ACTIVE,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .sort({ createdAt: -1 })
      .select('_id message theme startDate endDate')
      .lean();

    return successResponse(
      'Active alert fetched successfully',
      alert
        ? {
            id: alert._id.toString(),
            message: alert.message,
            theme: alert.theme,
            startDate: alert.startDate,
            endDate: alert.endDate,
          }
        : null,
    );
  }

  async findOne(messageId: string) {
    const message = await this.findMessage(messageId);
    // Populate recipient names for display (e.g. the resend confirmation).
    let recipients: string[] = [];
    try {
      if (Array.isArray(message.users) && message.users.length) {
        const users = await this.customerModel
          .find({ _id: { $in: message.users } })
          .select('businessName email')
          .lean();
        recipients = users
          .map((user: any) => user.businessName || user.email)
          .filter(Boolean);
      }
    } catch {
      /* best-effort recipient resolution */
    }
    return successResponse('Message fetched successfully', {
      ...message.toObject(),
      recipients,
    });
  }

  async updateAlert(messageId: string, dto: UpdateAdminAlertDto) {
    this.validateDateRange(dto.startDate, dto.endDate);
    const message = await this.findMessage(messageId);

    if (message.type !== AdminMessageType.ALERT) {
      throw new BadRequestException("Email messages can't be edited");
    }

    message.message = dto.message.trim();
    message.theme = dto.theme;
    message.startDate = new Date(dto.startDate);
    message.endDate = new Date(dto.endDate);
    await message.save();

    return successResponse('Message updated successfully', message);
  }

  async resend(messageId: string) {
    const message = await this.findMessage(messageId);
    if (message.type !== AdminMessageType.EMAIL) {
      throw new BadRequestException('Only email messages can be resent');
    }
    if (message.status === AdminMessageStatus.PENDING) {
      throw new BadRequestException('This email is still being delivered');
    }

    const recipients = await this.customerModel.find({
      _id: { $in: message.users },
      active: true,
      email: { $exists: true, $ne: '' },
    });

    if (!recipients.length) {
      throw new BadRequestException('No active original recipients were found');
    }

    message.status = AdminMessageStatus.PENDING;
    message.recipientCount = recipients.length;
    message.deliveredCount = 0;
    message.failedCount = 0;
    message.resendCount += 1;
    await message.save();

    await this.enqueueEmail(message, recipients);
    return successResponse('Message queued for resend successfully', message);
  }

  async activate(messageId: string) {
    const message = await this.findAlert(messageId);

    await this.messageModel.updateMany(
      {
        _id: { $ne: message._id },
        type: AdminMessageType.ALERT,
        status: AdminMessageStatus.ACTIVE,
      },
      { status: AdminMessageStatus.INACTIVE },
    );

    message.status = AdminMessageStatus.ACTIVE;
    await message.save();
    return successResponse('Message activated successfully', message);
  }

  async deactivate(messageId: string) {
    const message = await this.findAlert(messageId);
    message.status = AdminMessageStatus.INACTIVE;
    await message.save();
    return successResponse('Message deactivated successfully', message);
  }

  async remove(messageId: string) {
    const message = await this.findMessage(messageId);
    if (message.status === AdminMessageStatus.PENDING) {
      throw new BadRequestException(
        'A message being delivered cannot be deleted',
      );
    }
    await message.deleteOne();
    return successResponse('Message deleted successfully');
  }

  private async findMessage(messageId: string) {
    if (!Types.ObjectId.isValid(messageId)) {
      throw new NotFoundException('Message not found');
    }
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');
    return message;
  }

  private async findAlert(messageId: string) {
    const message = await this.findMessage(messageId);
    if (message.type !== AdminMessageType.ALERT) {
      throw new BadRequestException("Email message status can't be changed");
    }
    return message;
  }

  private async resolveRecipients(users: string[] = []) {
    const allCustomers = users.length === 1 && users[0] === 'all';
    if (!users.length || (users.includes('all') && !allCustomers)) {
      throw new BadRequestException(
        'Use either all customers or a list of customer ids',
      );
    }

    const filter: Record<string, unknown> = {
      active: true,
      email: { $exists: true, $ne: '' },
    };

    if (!allCustomers) {
      if (users.some((id) => !Types.ObjectId.isValid(id))) {
        throw new BadRequestException('One or more customer ids are invalid');
      }
      filter._id = {
        $in: [...new Set(users)].map((id) => new Types.ObjectId(id)),
      };
    }

    const recipients = await this.customerModel.find(filter);
    if (!recipients.length) {
      throw new BadRequestException('No active email recipients were found');
    }

    if (!allCustomers && recipients.length !== new Set(users).size) {
      throw new BadRequestException(
        'One or more selected customers are unavailable or inactive',
      );
    }

    return {
      recipients,
      audience: allCustomers
        ? AdminMessageAudience.ALL
        : AdminMessageAudience.SELECTED,
    };
  }

  private async enqueueEmail(
    message: AdminMessageDocument,
    recipients: BusinessCustomerDocument[],
  ) {
    try {
      const run = message.resendCount || 0;
      await this.emailQueue.addBulk(
        recipients.map((recipient) => ({
          name: JOB_NAMES.SEND_ADMIN_MESSAGE_EMAIL,
          data: {
            messageId: message._id.toString(),
            recipientId: recipient._id.toString(),
            recipientEmail: recipient.email,
            recipientName:
              [recipient.firstName, recipient.lastName]
                .filter(Boolean)
                .join(' ') || recipient.businessName,
            subject: message.subject,
            message: message.message,
          },
          opts: {
            jobId: `admin-message-${message._id}-${run}-${recipient._id}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 100,
          },
        })),
      );
    } catch (error) {
      message.status = AdminMessageStatus.FAILED;
      message.failedCount = message.recipientCount;
      await message.save();
      throw new InternalServerErrorException(
        'Unable to queue message delivery',
      );
    }
  }

  private validateDateRange(startDate?: string, endDate?: string) {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException(
        'Start date cannot be later than the end date',
      );
    }
  }

  private toOptionalObjectId(id?: string) {
    return id && Types.ObjectId.isValid(id)
      ? new Types.ObjectId(id)
      : undefined;
  }
}
