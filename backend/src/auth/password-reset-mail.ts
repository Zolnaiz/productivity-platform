import { MailLanguage, interpolate } from '../shared/mail/wording';

/** How long a reset link lives. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

/** A second request inside this window is accepted but sends nothing: mail-bombing a colleague is not a feature. */
export const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000;

const WORDS: Record<MailLanguage, Record<'subject' | 'intro' | 'open' | 'code' | 'expiry' | 'ignore', string>> = {
  mn: {
    subject: 'Нууц үг сэргээх',
    intro: 'Таны бүртгэлийн нууц үгийг сэргээх хүсэлт ирлээ.',
    open: 'Шинэ нууц үг тохируулахын тулд энэ холбоосыг нээнэ үү:\n{{link}}',
    code: 'Таны сэргээх код: {{token}}',
    expiry: 'Холбоос 1 цагийн дотор, зөвхөн нэг удаа ажиллана.',
    ignore: 'Хэрэв та хүсэлт илгээгээгүй бол энэ захидлыг үл тоож болно. Нууц үг өөрчлөгдөхгүй.',
  },
  en: {
    subject: 'Reset your password',
    intro: 'We received a request to reset the password of your account.',
    open: 'Open this link to set a new password:\n{{link}}',
    code: 'Your reset code is: {{token}}',
    expiry: 'The link works once and expires in 1 hour.',
    ignore: 'If you did not ask for this, ignore this email. Your password stays as it is.',
  },
};

export const passwordResetMail = (language: MailLanguage, token: string, baseUrl: string) => {
  const words = WORDS[language];
  const base = baseUrl.replace(/\/$/, '');
  const link = `${base}/reset-password/${token}`;

  return {
    subject: words.subject,
    body: [
      words.intro,
      base ? interpolate(words.open, { link }) : interpolate(words.code, { token }),
      words.expiry,
      words.ignore,
    ].join('\n\n'),
  };
};
