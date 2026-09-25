import { classToPlain, plainToInstance } from 'class-transformer';
import { User } from './user.entity';

/**
 * What leaves the server when a user is sent anywhere.
 *
 * Every response goes through `classToPlain` in `TransformInterceptor`, so
 * this is the same transformation the list of colleagues, a profile and a
 * sign-in response all get.
 */
describe('a user as the API sends it', () => {
  const user = plainToInstance(User, {
    id: 'u1',
    email: 'admin@example.com',
    firstName: 'Oyun',
    password: '$2b$10$hash',
    verificationToken: 'verify-me',
    resetPasswordToken: 'reset-me',
    resetPasswordExpires: new Date('2026-09-26'),
  });

  it('carries nothing that would let somebody else into the account', () => {
    // A reset token is as good as the password while it is live.
    const sent = classToPlain(user);

    expect(sent).not.toHaveProperty('password');
    expect(sent).not.toHaveProperty('resetPasswordToken');
    expect(sent).not.toHaveProperty('resetPasswordExpires');
    expect(sent).not.toHaveProperty('verificationToken');
  });

  it('still carries who they are', () => {
    expect(classToPlain(user)).toMatchObject({ id: 'u1', email: 'admin@example.com', firstName: 'Oyun' });
  });
});
