import { Logger } from '@nestjs/common';
import { createMailer, LoggingMailer, SmtpMailer } from './mailer';

const config = (values: Record<string, unknown>) =>
  ({ get: (key: string) => values[key] }) as never;

/**
 * Reaching somebody who is not looking at the application.
 *
 * The in-app inbox is the record and works with no mail server at all, so the
 * default has to be a transport that sends nothing and says so.
 */
describe('the mailer a deployment runs', () => {
  it('sends nothing when nothing is configured', () => {
    const mailer = createMailer(config({}));

    expect(mailer.describe()).toContain('no transport');
    expect(mailer).toBeInstanceOf(LoggingMailer);
  });

  it('never writes the body to the log, because an invitation body is a token', async () => {
    const logged: string[] = [];
    const spy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation((message: unknown) => void logged.push(String(message)));

    await new LoggingMailer().send({
      to: 'new@example.com',
      subject: 'You have been invited',
      body: 'Your invitation code is: super-secret-token',
    });

    expect(logged.join('\n')).toContain('new@example.com');
    expect(logged.join('\n')).not.toContain('super-secret-token');
    spy.mockRestore();
  });

  it('refuses to start as SMTP without somewhere to send from and to', () => {
    // At startup, where somebody is watching, rather than at the first
    // invitation somebody tries to issue.
    expect(() => createMailer(config({ MAIL_TRANSPORT: 'smtp' }))).toThrow(/SMTP_HOST/);
    expect(() =>
      createMailer(config({ MAIL_TRANSPORT: 'smtp', SMTP_HOST: 'mail.plant.local' })),
    ).toThrow(/MAIL_FROM/);
  });

  it('names the server it will send through', () => {
    const mailer = createMailer(
      config({
        MAIL_TRANSPORT: 'smtp',
        SMTP_HOST: 'mail.plant.local',
        SMTP_PORT: '2525',
        MAIL_FROM: 'platform@plant.local',
      }),
    );

    expect(mailer.describe()).toBe('SMTP at mail.plant.local:2525 as platform@plant.local');
  });

  it('sends plain text from the configured address', async () => {
    const sent: Array<Record<string, unknown>> = [];
    const mailer = new SmtpMailer(
      { sendMail: async (mail: Record<string, unknown>) => void sent.push(mail) } as never,
      'platform@plant.local',
      'mail.plant.local:587',
    );

    await mailer.send({ to: 'sara@plant.local', subject: 'Audit due', body: 'A01 is due today' });

    expect(sent[0]).toMatchObject({
      from: 'platform@plant.local',
      to: 'sara@plant.local',
      subject: 'Audit due',
      text: 'A01 is due today',
    });
  });

  it('lets a failure reach the caller, which is what swallows it', async () => {
    // The transport does not decide that a failure is unimportant; the two
    // callers do, each for its own reason.
    const mailer = new SmtpMailer(
      { sendMail: async () => Promise.reject(new Error('refused')) } as never,
      'platform@plant.local',
      'mail.plant.local:587',
    );

    await expect(mailer.send({ to: 'x@y.z', subject: 's', body: 'b' })).rejects.toThrow('refused');
  });
});
