import { Resend } from 'resend';

export interface EmailServiceConfig {
  apiKey: string;
  /** E.g. "My App <noreply@mydomain.com>" or just "noreply@mydomain.com" */
  from: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  /** Override the default "from" for this specific email */
  from?: string;
}

export class EmailService {
  private readonly resend: Resend;

  constructor(private readonly config: EmailServiceConfig) {
    this.resend = new Resend(config.apiKey);
  }

  async send(options: SendEmailOptions): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: options.from ?? this.config.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
