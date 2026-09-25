import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createMailer, MAILER } from './mailer';

/**
 * One mailer, for everything that has to reach somebody outside the product.
 *
 * Global because the two callers are in different modules — an invitation is
 * issued by `auth`, a notification is raised by `operations` — and a second
 * copy of the transport would mean a deployment where one of them is
 * configured and the other silently is not.
 */
@Global()
@Module({
  providers: [
    {
      provide: MAILER,
      useFactory: createMailer,
      inject: [ConfigService],
    },
  ],
  exports: [MAILER],
})
export class MailModule {}
