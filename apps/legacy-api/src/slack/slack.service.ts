import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IncomingWebhook } from '@slack/webhook';
import { BusinessCustomerDocument } from '../business/schema/business.schema';

@Injectable()
export class SlackService {
  private webhooks: Partial<Record<string, IncomingWebhook>>;
  private readonly logger = new Logger(SlackService.name);

  constructor(private configService: ConfigService) {
    // Initialize webhooks for different channels
    this.webhooks = {
      users: this.createWebhook('SLACK_USERS_WEBHOOK_URL'),
    };
  }

  private createWebhook(configKey: string): IncomingWebhook | undefined {
    const webhookUrl = this.configService.get<string>(configKey);
    if (!webhookUrl) {
      this.logger.warn(
        `Slack webhook URL for ${configKey} is not configured; notifications for this channel are disabled.`,
      );
      return undefined;
    }
    return new IncomingWebhook(webhookUrl);
  }

  private async sendNotification(
    channel: keyof typeof this.webhooks,
    message: any,
    context: string,
    id: string,
  ): Promise<void> {
    try {
      const webhook = this.webhooks[channel];
      if (!webhook) {
        this.logger.warn(
          `Skipping Slack notification for ${context} ${id} because channel ${channel} is not configured.`,
        );
        return;
      }
      await webhook.send(message);
    } catch (error) {
      this.logger.error(
        `Failed to send Slack notification for ${context} ${id}`,
        error.stack,
      );
      throw error;
    }
  }

  async sendNewUserNotification(
    customer: BusinessCustomerDocument,
  ): Promise<void> {
    const message = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '👋 New User Registration!',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Business Name:*\n${customer.businessName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Sign Up Date:*\n${new Date().toLocaleDateString()}`,
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Name:*\n${customer.firstName} ${customer.lastName}`,
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${customer.email}`,
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Phone Number:*\n${customer.phoneNumber}`,
            },
          ],
        },
        {
          type: 'divider',
        },
      ],
    };

    await this.sendNotification('users', message, 'new user', customer.id);
  }
}
