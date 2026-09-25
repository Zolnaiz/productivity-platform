import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

/**
 * Reaching somebody who is not looking at the application.
 *
 * The inbox inside the product is the record: it says what was raised, to
 * whom, exactly once. What it cannot do is reach an operator who is on the
 * floor and a supervisor who is on leave — and the invitation has the same
 * hole, since the API issues a token and somebody then sends it by hand, which
 * means a new colleague's first experience of the system is a link pasted into
 * a chat window.
 *
 * One transport serves both, and neither caller may fail because of it: an
 * audit that was raised and not emailed is still raised, and an invitation
 * that was issued and not delivered can be reissued. Sending is therefore
 * always attempted after the record exists, never before, and a failure is
 * logged rather than thrown.
 */
export interface OutgoingMail {
  to: string;
  subject: string;
  /** Plain text. Everything this application sends reads as a short note. */
  body: string;
}

export interface Mailer {
  send(mail: OutgoingMail): Promise<void>;
  /** For the startup log, so an operator can see what is configured. */
  describe(): string;
}

export const MAILER = 'MAILER';

/**
 * Writes what would have been sent, and sends nothing.
 *
 * The default, because a deployment with no mail server must still work — the
 * in-app inbox is the record, and this is an addition to it. It deliberately
 * logs the recipient and the subject and never the body: an invitation's body
 * carries a token that would then be readable by anybody with the logs.
 */
export class LoggingMailer implements Mailer {
  private readonly logger = new Logger('Mailer');

  async send(mail: OutgoingMail) {
    this.logger.log(`Mail not sent (no transport configured): "${mail.subject}" for ${mail.to}`);
  }

  describe() {
    return 'no transport (messages are logged, not sent)';
  }
}

/** Mail over SMTP. */
export class SmtpMailer implements Mailer {
  constructor(
    private readonly transport: Pick<Transporter, 'sendMail'>,
    private readonly from: string,
    private readonly where: string,
  ) {}

  async send(mail: OutgoingMail) {
    await this.transport.sendMail({
      from: this.from,
      to: mail.to,
      subject: mail.subject,
      text: mail.body,
    });
  }

  describe() {
    return `SMTP at ${this.where} as ${this.from}`;
  }
}

/**
 * The mailer this deployment is configured for.
 *
 * `MAIL_TRANSPORT=smtp` switches; anything else logs. A transport named
 * without a host or a from address is refused at startup, where somebody is
 * watching the service come up, rather than at the first invitation.
 */
export const createMailer = (configService: ConfigService): Mailer => {
  const logger = new Logger('Mailer');
  const setting = (key: string, fallback: string) => configService.get<string>(key) ?? fallback;

  if (setting('MAIL_TRANSPORT', 'log') !== 'smtp') {
    const mailer = new LoggingMailer();
    logger.log(`Mail: ${mailer.describe()}`);

    return mailer;
  }

  const host = setting('SMTP_HOST', '');
  const from = setting('MAIL_FROM', '');

  if (!host || !from) {
    throw new Error('MAIL_TRANSPORT=smtp needs SMTP_HOST and MAIL_FROM');
  }

  const port = Number(setting('SMTP_PORT', '587'));
  const user = setting('SMTP_USER', '');
  const password = setting('SMTP_PASSWORD', '');

  const mailer = new SmtpMailer(
    createTransport({
      host,
      port,
      // 465 is implicit TLS; 587 starts plain and upgrades. Either way the
      // connection ends up encrypted, and the default follows the port rather
      // than making somebody remember which is which.
      secure: configService.get<boolean>('SMTP_SECURE') ?? port === 465,
      ...(user && password ? { auth: { user, pass: password } } : {}),
    }),
    from,
    `${host}:${port}`,
  );

  logger.log(`Mail: ${mailer.describe()}`);

  return mailer;
};
