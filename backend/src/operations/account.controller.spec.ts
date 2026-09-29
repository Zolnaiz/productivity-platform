import { AccountController } from './account.controller';

describe('asking for an account to be deleted', () => {
  const createController = () => {
    const users = {
      findOne: jest.fn(async () => ({ id: 'u1', firstName: 'Bat', lastName: 'Erdene', email: 'bat@example.com' })),
      find: jest.fn(async () => [
        { id: 'a1', role: 'admin' },
        { id: 'a2', role: 'super_admin' },
      ]),
    };
    const notifications = { notify: jest.fn(async () => ({ id: 'n' })) };
    return { controller: new AccountController(users as never, notifications as never), users, notifications };
  };

  it('tells every administrator of the organization, once each', async () => {
    const { controller, notifications } = createController();

    const result = await controller.requestDeletion({ user: { id: 'u1', organizationId: 'org-1' } });

    expect(result).toEqual({ requested: true, administratorsTold: 2 });
    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'a1',
        titleKey: 'raised.deletionRequested',
        titleParams: { name: 'Bat Erdene' },
        sourceType: 'account_deletion',
        sourceId: 'u1',
      }),
    );
  });

  it('does not tell an administrator about their own request', async () => {
    const { controller, notifications } = createController();

    await controller.requestDeletion({ user: { id: 'a1', organizationId: 'org-1' } });

    expect(notifications.notify).toHaveBeenCalledTimes(1);
    expect(notifications.notify).toHaveBeenCalledWith(expect.objectContaining({ userId: 'a2' }));
  });
});
