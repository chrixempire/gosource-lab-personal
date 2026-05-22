import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { readTemplate } from '../../utils/helpers';
import * as dotenv from 'dotenv';
import { NewEmailInterface, MailtrapEmailInterface } from './email.interface';
import { ConfigService } from '@nestjs/config';
import * as mailchimp from '@mailchimp/mailchimp_marketing';
dotenv.config();

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    mailchimp.setConfig({
      apiKey: this.configService.get<string>('MAILCHIMP_API_KEY'),
      server: this.configService.get<string>('MAILCHIMP_SERVER_PREFIX'),
    });
  }
  /**
   * Send email
   *
   * @param data
   */
  async sendMail1(data: NewEmailInterface): Promise<any> {
    const variables = data.variables;
    const subject = data.subject;
    const from = 'GoSource <gosource@ipc-africa.com>';
    const template = data.template;
    const to = data.to;
    const attachments = data.attachments ? data.attachments : null;

    const htmlContent = readTemplate(template, variables);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST_NAME,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const message: any = {
      from,
      to,
      subject,
      html: htmlContent,
    };

    if (attachments) {
      message.attachments = attachments;
    }

    await transport.sendMail(message);
  }

  async addSubscriber(
    email: string,
    firstName: string,
    lastName: string,
  ): Promise<any> {
    try {
      const response = await mailchimp.lists.addListMember(
        process.env.MAILCHIMP_LIST_ID,
        {
          email_address: email,
          status: 'subscribed',
          merge_fields: {
            FNAME: firstName,
            LNAME: lastName,
          },
        },
      );
      return response;
    } catch (error) {
      throw new Error(`Error adding subscriber: ${error.message}`);
    }
  }

  /**
   * Send email using Mailtrap API
   *
   * @param data - Mailtrap email data
   * @returns Promise<any>
   */
  async sendMailtrapEmail(data: MailtrapEmailInterface): Promise<any> {
    try {
      const mailtrapApiToken =
        this.configService.get<string>('MAILTRAP_API_TOKEN') ||
        '43e30e35633ef2bef5fd79d55467226f';
      const mailtrapEndpoint =
        this.configService.get<string>('MAILTRAP_ENDPOINT') ||
        'https://send.api.mailtrap.io/api/send';

      if (!mailtrapApiToken) {
        throw new Error('Mailtrap API token is not configured');
      }

      const response = await fetch(mailtrapEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mailtrapApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Mailtrap API error: ${response.status} - ${errorText}`,
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Error sending email via Mailtrap: ${error.message}`);
    }
  }

  /**
   * Send email using Mailtrap with template processing
   * This method combines template processing with Mailtrap sending
   * Uses the same interface as the original sendMail method for consistency
   *
   * @param data - NewEmailInterface or extended Mailtrap data
   * @param useTemplate - Whether to use template processing or send as-is
   * @returns Promise<any>
   */
  async sendMailWithMailtrap(
    data: NewEmailInterface & {
      to?: string | Array<{ email: string; name?: string }>;
      html?: string;
      text?: string;
      from?: { email: string; name?: string };
      category?: string;
      template_uuid?: string;
      template_variables?: object;
    },
    useTemplate: boolean = true,
  ): Promise<any> {
    try {
      let htmlContent = data.html;

      // Process template if specified and useTemplate is true
      if (useTemplate && data.template && data.variables) {
        htmlContent = readTemplate(data.template, data.variables);
      }

      // Prepare recipients array
      let recipients: Array<{ email: string; name?: string }>;
      if (typeof data.to === 'string') {
        recipients = [{ email: data.to }];
      } else {
        recipients = data.to;
      }

      // Prepare Mailtrap email data
      const mailtrapData: MailtrapEmailInterface = {
        to: recipients,
        from: data.from || {
          email:
            this.configService.get<string>('MAILTRAP_FROM_EMAIL') ||
            'gosource@ipc-africa.com',
          name:
            this.configService.get<string>('MAILTRAP_FROM_NAME') || 'GoSource',
        },
        subject: data.subject,
        html: htmlContent,
        text: data.text,
        category: data.category,
      };

      // Add template-specific fields if using Mailtrap templates
      if (data.template_uuid) {
        mailtrapData.template_uuid = data.template_uuid;
        mailtrapData.template_variables =
          data.template_variables || data.variables;
      }

      // Add attachments if provided
      if (data.attachments && data.attachments.length > 0) {
        mailtrapData.attachments = data.attachments.map((attachment) => ({
          content: attachment.content,
          filename: attachment.filename,
          type: attachment.type || 'application/octet-stream',
          disposition: attachment.disposition || 'attachment',
        }));
      }

      return await this.sendMailtrapEmail(mailtrapData);
    } catch (error) {
      throw new Error(`Error sending email with Mailtrap: ${error.message}`);
    }
  }

  /**
   * Send bulk emails using Mailtrap
   * Useful for newsletters, notifications, etc.
   *
   * @param recipients - Array of recipients
   * @param subject - Email subject
   * @param template - Template name or HTML content
   * @param variables - Template variables
   * @param options - Additional options
   * @returns Promise<any>
   */
  async sendBulkMailtrapEmail(
    recipients: Array<{ email: string; name?: string }>,
    subject: string,
    template: string,
    variables: object = {},
    options: {
      from?: { email: string; name?: string };
      category?: string;
      useTemplate?: boolean;
      template_uuid?: string;
    } = {},
  ): Promise<any> {
    try {
      const { from, category, useTemplate = true, template_uuid } = options;

      // Split recipients into chunks if too many (Mailtrap limits)
      const maxRecipientsPerEmail = 500; // Adjust based on Mailtrap limits
      const chunks = [];
      for (let i = 0; i < recipients.length; i += maxRecipientsPerEmail) {
        chunks.push(recipients.slice(i, i + maxRecipientsPerEmail));
      }

      const results = [];
      for (const chunk of chunks) {
        const emailData = {
          to: chunk,
          subject,
          template: useTemplate ? template : undefined,
          html: !useTemplate ? template : undefined,
          variables,
          from,
          category,
          template_uuid,
          template_variables: template_uuid ? variables : undefined,
        };

        const result = await this.sendMailWithMailtrap(emailData, useTemplate);
        results.push(result);
      }

      return {
        success: true,
        totalRecipients: recipients.length,
        chunks: chunks.length,
        results,
      };
    } catch (error) {
      throw new Error(
        `Error sending bulk email via Mailtrap: ${error.message}`,
      );
    }
  }

  /**
   * Send email using Mailtrap API with the same interface as sendMail
   * This method provides a drop-in replacement for sendMail using Mailtrap
   *
   * @param data - NewEmailInterface (same as sendMail)
   * @returns Promise<any>
   */
  async sendMail(data: NewEmailInterface): Promise<any> {
    if (this.isEmailSendDisabled()) {
      console.info(
        `[EmailService] Skipped send to ${data.to} (${data.subject}) — EMAIL_SEND_DISABLED is set`,
      );
      return { skipped: true, to: data.to, subject: data.subject };
    }

    try {
      // Process template using existing template system
      const htmlContent = readTemplate(data.template, data.variables);

      // Prepare Mailtrap email data
      const mailtrapData: MailtrapEmailInterface = {
        to: [{ email: data.to }],
        from: {
          email:
            this.configService.get<string>('MAILTRAP_FROM_EMAIL') ||
            'gosource@ipc-africa.com',
          name:
            this.configService.get<string>('MAILTRAP_FROM_NAME') || 'GoSource',
        },
        subject: data.subject,
        html: htmlContent,
      };

      // Add attachments if provided
      if (data.attachments) {
        mailtrapData.attachments = Array.isArray(data.attachments)
          ? data.attachments.map((attachment) => ({
              content: attachment.content,
              filename: attachment.filename,
              type: attachment.type || 'application/octet-stream',
              disposition: attachment.disposition || 'attachment',
            }))
          : [
              {
                content: data.attachments.content,
                filename: data.attachments.filename,
                type: data.attachments.type || 'application/octet-stream',
                disposition: data.attachments.disposition || 'attachment',
              },
            ];
      }

      return await this.sendMailtrapEmail(mailtrapData);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown email delivery error';
      this.logger.error(
        `Failed to send email to ${data.to} (${data.subject}): ${message}`,
      );
      return { failed: true, to: data.to, subject: data.subject, message };
    }
  }

  /**
   * Send bulk emails using Mailtrap with NewEmailInterface
   * This method allows sending the same email to multiple recipients
   *
   * @param recipients - Array of email addresses or recipient objects
   * @param emailData - NewEmailInterface (same as sendMail)
   * @param options - Additional Mailtrap options
   * @returns Promise<any>
   */
  async sendBulkMailtrapWithTemplate(
    recipients: string[] | Array<{ email: string; name?: string }>,
    emailData: Omit<NewEmailInterface, 'to'>,
    options: {
      from?: { email: string; name?: string };
      category?: string;
    } = {},
  ): Promise<any> {
    try {
      // Convert string array to recipient objects if needed
      const formattedRecipients: Array<{ email: string; name?: string }> =
        recipients.map((recipient) =>
          typeof recipient === 'string' ? { email: recipient } : recipient,
        );

      // Process template using existing template system
      const htmlContent = readTemplate(emailData.template, emailData.variables);

      // Split recipients into chunks if too many (Mailtrap limits)
      const maxRecipientsPerEmail = 500;
      const chunks = [];
      for (
        let i = 0;
        i < formattedRecipients.length;
        i += maxRecipientsPerEmail
      ) {
        chunks.push(formattedRecipients.slice(i, i + maxRecipientsPerEmail));
      }

      const results = [];
      for (const chunk of chunks) {
        const mailtrapData: MailtrapEmailInterface = {
          to: chunk,
          from: options.from || {
            email:
              this.configService.get<string>('MAILTRAP_FROM_EMAIL') ||
              'gosource@ipc-africa.com',
            name:
              this.configService.get<string>('MAILTRAP_FROM_NAME') ||
              'GoSource',
          },
          subject: emailData.subject,
          html: htmlContent,
          category: options.category,
        };

        // Add attachments if provided
        if (emailData.attachments) {
          mailtrapData.attachments = Array.isArray(emailData.attachments)
            ? emailData.attachments.map((attachment) => ({
                content: attachment.content,
                filename: attachment.filename,
                type: attachment.type || 'application/octet-stream',
                disposition: attachment.disposition || 'attachment',
              }))
            : [
                {
                  content: emailData.attachments.content,
                  filename: emailData.attachments.filename,
                  type:
                    emailData.attachments.type || 'application/octet-stream',
                  disposition:
                    emailData.attachments.disposition || 'attachment',
                },
              ];
        }

        const result = await this.sendMailtrapEmail(mailtrapData);
        results.push(result);
      }

      return {
        success: true,
        totalRecipients: formattedRecipients.length,
        chunks: chunks.length,
        results,
      };
    } catch (error) {
      throw new Error(
        `Error sending bulk email via Mailtrap with template: ${error.message}`,
      );
    }
  }

  /** When true, outbound email is logged and skipped (local dev / Mailtrap quota). */
  private isEmailSendDisabled(): boolean {
    const flag = process.env.EMAIL_SEND_DISABLED?.trim().toLowerCase();
    return flag === 'true' || flag === '1' || flag === 'yes';
  }
}
