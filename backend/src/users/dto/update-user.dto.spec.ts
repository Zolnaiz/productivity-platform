import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

/**
 * The escalation regression test.
 *
 * `PATCH /users/:id` is reachable by any signed-in account for its own record.
 * While `UpdateUserDto` carried `role`, that request was a one-step promotion
 * to super admin, and `organizationId` was a one-step move into another
 * tenant. The global pipe runs `forbidNonWhitelisted`, so the fields being
 * absent from this class is what rejects them — this test is what keeps them
 * absent.
 */
const validateBody = (body: Record<string, unknown>) =>
  validate(plainToInstance(UpdateUserDto, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('UpdateUserDto', () => {
  it.each(['role', 'organizationId', 'isActive', 'password'])(
    'refuses a body carrying %s',
    async (field) => {
      const errors = await validateBody({ firstName: 'Бат', [field]: 'super_admin' });

      expect(errors.map((error) => error.property)).toContain(field);
    },
  );

  it('accepts the details a member may edit', async () => {
    const errors = await validateBody({
      firstName: 'Бат',
      lastName: 'Дорж',
      email: 'bat@example.com',
      position: 'Үйлдвэрлэлийн инженер',
      phone: '+97699112233',
    });

    expect(errors).toEqual([]);
  });

  it('accepts an empty body, so a no-op edit is not an error', async () => {
    expect(await validateBody({})).toEqual([]);
  });
});
