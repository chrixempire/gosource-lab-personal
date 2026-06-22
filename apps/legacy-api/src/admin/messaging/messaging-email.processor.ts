import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { EmailService } from '../../notification/email/email.service';
import { JOB_NAMES, QUEUE_NAMES } from '../../jobs/constants';
import { AdminMessageStatus } from './enum/message.enum';
import { AdminMessage, AdminMessageDocument } from './schema/message.schema';

export interface AdminMessageEmailJob {
  messageId: string;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
}

@Processor(QUEUE_NAMES.ADMIN_MESSAGING_EMAIL)
export class AdminMessagingEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(AdminMessagingEmailProcessor.name);

  constructor(
    @InjectModel(AdminMessage.name)
    private readonly messageModel: Model<AdminMessageDocument>,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<AdminMessageEmailJob>) {
    if (job.name !== JOB_NAMES.SEND_ADMIN_MESSAGE_EMAIL) {
      this.logger.warn(`Unsupported admin messaging job: ${job.name}`);
      return;
    }

    try {
      const result = await this.emailService.sendMail({
        to: job.data.recipientEmail,
        subject: job.data.subject,
        template: 'admin-customer-message',
        variables: {
          SUBJECT: escapeHtml(job.data.subject),
          MESSAGE: escapeHtml(job.data.message),
          CUSTOMER: escapeHtml(job.data.recipientName || 'Customer'),
        },
      });

      if (result?.failed) {
        throw new Error(result.message || 'Email delivery failed');
      }

      await this.recordResult(job.data.messageId, true);
      return result;
    } catch (error) {
      const maxAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

      if (isFinalAttempt) {
        await this.recordResult(job.data.messageId, false);
      }

      throw error;
    }
  }

  private async recordResult(messageId: string, delivered: boolean) {
    const message = await this.messageModel.findByIdAndUpdate(
      messageId,
      { $inc: delivered ? { deliveredCount: 1 } : { failedCount: 1 } },
      { new: true },
    );

    if (!message) return;

    const processed = message.deliveredCount + message.failedCount;
    if (processed < message.recipientCount) return;

    message.status = message.failedCount
      ? AdminMessageStatus.FAILED
      : AdminMessageStatus.SENT;
    message.lastSentAt = new Date();
    await message.save();
  }
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
