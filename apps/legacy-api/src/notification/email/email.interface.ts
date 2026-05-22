export interface NewEmailInterface {
  variables: object;
  subject: string;
  template: string;
  to: string;
  attachments?: any;
}

export interface MailtrapEmailInterface {
  to: Array<{ email: string; name?: string }>;
  from: { email: string; name?: string };
  subject: string;
  text?: string;
  html?: string;
  template_uuid?: string;
  template_variables?: object;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
  headers?: object;
  custom_variables?: object;
  category?: string;
}
