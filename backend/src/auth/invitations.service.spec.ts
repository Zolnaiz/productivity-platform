import { Logger } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { UserRole } from '../shared/constants';
import { hashInvitationToken } from './invitation-token';

const createService = () => {
  const rows: any[] = [];

  const invitations = {
    create: jest.fn((value) => ({ id: `invitation-${rows.length + 1}`, ...value })),
    save: jest.fn(async (value) => {
      if (!rows.includes(value)) rows.push(value);
      return value;
    }),
    find: jest.fn(async ({ where }) =>
      rows.filter(
        (row) => row.organizationId === where.organizationId && !row.acceptedAt && row.expiresAt > new Date(),
      ),
    ),
    findOne: jest.fn(async ({ where }) =>
      rows.find((row) =>
        where.tokenHash
          ? row.tokenHash === where.tokenHash
          : row.id === where.id && row.organizationId === where.organizationId,
      ) ?? null,
    ),
    delete: jest.fn(async (where) => {
      const before = rows.length;
      for (let i = rows.length - 1; i >= 0; i -= 1) {
        const row = rows[i];
        const matchesOrg = !where.organizationId || row.organizationId === where.organizationId;
        const matchesEmail = !where.email || row.email === where.email;
        if (matchesOrg && matchesEmail && !row.acceptedAt) rows.splice(i, 1);
      }
      return { affected: before - rows.length };
    }),
    remove: jest.fn(async (row) => {
      rows.splice(rows.indexOf(row), 1);
      return row;
    }),
  };

  const usersService = {
    findByEmail: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'user-new' }),
  };

  const service = new InvitationsService(invitations as never, usersService as never);

  return { service, invitations, usersService, rows };
};

const owner = { id: 'user-1', organizationId: 'org-1', role: UserRole.ORGANIZATION_ADMIN };

describe('creating an invitation', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns the raw token exactly once and stores only its hash', async () => {
    const { service, rows } = createService();

    const { token, invitation } = await service.invite('New@Example.com ', UserRole.USER, owner);

    expect(token).toEqual(expect.any(String));
    expect(rows[0].tokenHash).toBe(hashInvitationToken(token));
    // The summary handed back must never carry the token or its hash.
    expect(JSON.stringify(invitation)).not.toContain(token);
    expect(JSON.stringify(invitation)).not.toContain(rows[0].tokenHash);
  });

  it('normalises the address so it can be matched later', async () => {
    const { service, rows } = createService();

    await service.invite('  New@Example.COM ', UserRole.USER, owner);

    expect(rows[0].email).toBe('new@example.com');
  });

  it('refuses to invite somebody who already has an account', async () => {
    const { service, usersService } = createService();
    usersService.findByEmail.mockResolvedValue({ id: 'existing' });

    await expect(service.invite('taken@example.com', UserRole.USER, owner)).rejects.toMatchObject({
      response: { errorCode: 'AUTH_EMAIL_TAKEN' },
    });
  });

  it('refuses a role the inviter could not assign themselves', async () => {
    const { service } = createService();
    const manager = { ...owner, role: UserRole.MANAGER };

    // A manager may add a user, but must not be able to mint an admin.
    await expect(service.invite('x@example.com', UserRole.USER, manager)).resolves.toBeTruthy();
    await expect(service.invite('y@example.com', UserRole.ADMIN, manager)).rejects.toMatchObject({
      response: { errorCode: 'ACCESS_DENIED' },
    });
  });

  it('refuses an inviter with no organization', async () => {
    const { service } = createService();

    await expect(
      service.invite('x@example.com', UserRole.USER, { id: 'u', role: UserRole.ORGANIZATION_ADMIN }),
    ).rejects.toMatchObject({ response: { errorCode: 'AUTH_ORGANIZATION_REQUIRED' } });
  });

  it('replaces a pending invitation rather than leaving two valid tokens', async () => {
    const { service, rows } = createService();

    await service.invite('new@example.com', UserRole.USER, owner);
    await service.invite('new@example.com', UserRole.USER, owner);

    expect(rows).toHaveLength(1);
  });
});

describe('accepting an invitation', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  const details = { firstName: 'Bat', lastName: 'Erdene', password: 'Password123' };

  it('creates the user inside the inviting organization, not a new one', async () => {
    const { service, usersService } = createService();
    const { token } = await service.invite('new@example.com', UserRole.MANAGER, owner);

    await service.accept(token, details);

    const [payload, organizationId] = usersService.create.mock.calls[0];
    expect(organizationId).toBe('org-1');
    expect(payload.email).toBe('new@example.com');
    expect(payload.role).toBe(UserRole.MANAGER);
  });

  it('fixes the address, so a forwarded link cannot be used under another identity', async () => {
    const { service, usersService } = createService();
    const { token } = await service.invite('invited@example.com', UserRole.USER, owner);

    await service.accept(token, details);

    expect(usersService.create.mock.calls[0][0].email).toBe('invited@example.com');
  });

  it('cannot be used twice', async () => {
    const { service } = createService();
    const { token } = await service.invite('new@example.com', UserRole.USER, owner);

    await service.accept(token, details);

    await expect(service.accept(token, details)).rejects.toMatchObject({
      response: { errorCode: 'INVITATION_USED' },
    });
  });

  it('rejects an expired invitation', async () => {
    const { service, rows } = createService();
    const { token } = await service.invite('new@example.com', UserRole.USER, owner);
    rows[0].expiresAt = new Date(Date.now() - 1000);

    await expect(service.accept(token, details)).rejects.toMatchObject({
      response: { errorCode: 'INVITATION_EXPIRED' },
    });
  });

  it('rejects a token nobody issued', async () => {
    const { service } = createService();

    await expect(service.accept('made-up-token', details)).rejects.toMatchObject({
      response: { errorCode: 'INVITATION_INVALID' },
    });
    await expect(service.accept('', details)).rejects.toMatchObject({
      response: { errorCode: 'INVITATION_INVALID' },
    });
  });

  it('refuses when the address was claimed between invite and accept', async () => {
    const { service, usersService } = createService();
    const { token } = await service.invite('new@example.com', UserRole.USER, owner);
    usersService.findByEmail.mockResolvedValue({ id: 'raced' });

    await expect(service.accept(token, details)).rejects.toMatchObject({
      response: { errorCode: 'AUTH_EMAIL_TAKEN' },
    });
  });
});

describe('previewing an invitation', () => {
  beforeEach(() => jest.spyOn(Logger.prototype, 'log').mockImplementation());
  afterEach(() => jest.restoreAllMocks());

  it('shows only who it is for and what it grants', async () => {
    const { service } = createService();
    const { token } = await service.invite('new@example.com', UserRole.MANAGER, owner);

    const preview = await service.preview(token);

    // A valid token must not become a way to read an organization's data.
    expect(preview).toEqual({
      email: 'new@example.com',
      role: UserRole.MANAGER,
      organizationId: 'org-1',
    });
  });
});

describe('listing and revoking', () => {
  beforeEach(() => jest.spyOn(Logger.prototype, 'log').mockImplementation());
  afterEach(() => jest.restoreAllMocks());

  it('never includes a token in the pending list', async () => {
    const { service } = createService();
    const { token } = await service.invite('new@example.com', UserRole.USER, owner);

    const pending = await service.findPending(owner);

    expect(pending).toHaveLength(1);
    expect(JSON.stringify(pending)).not.toContain(token);
    expect(JSON.stringify(pending)).not.toContain('tokenHash');
  });

  it('revokes a pending invitation', async () => {
    const { service, rows } = createService();
    const { invitation, token } = await service.invite('new@example.com', UserRole.USER, owner);

    await service.revoke(invitation.id, owner);

    expect(rows).toHaveLength(0);
    await expect(service.preview(token)).rejects.toMatchObject({
      response: { errorCode: 'INVITATION_INVALID' },
    });
  });

  it('will not revoke another organization invitation', async () => {
    const { service } = createService();
    const { invitation } = await service.invite('new@example.com', UserRole.USER, owner);

    await expect(
      service.revoke(invitation.id, { ...owner, organizationId: 'org-2' }),
    ).rejects.toMatchObject({ response: { errorCode: 'RESOURCE_NOT_FOUND' } });
  });
});
