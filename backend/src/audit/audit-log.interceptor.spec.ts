import { Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { AuditLogInterceptor, describeRoute, severityFor } from './audit-log.interceptor';
import { AuditLogService } from './audit-log.service';

describe('describing what a route did', () => {
  it('reads the named action off the end of the route', () => {
    // `POST /users/:id/deactivate` is a deactivation, not a creation.
    expect(describeRoute('POST', '/users/:id/deactivate')).toEqual({ module: 'users', action: 'deactivate' });
    expect(describeRoute('POST', '/users/:id/change-role')).toEqual({ module: 'users', action: 'change-role' });
  });

  it('falls back to what the method means', () => {
    expect(describeRoute('POST', '/projects')).toEqual({ module: 'projects', action: 'created' });
    expect(describeRoute('PATCH', '/projects/:id')).toEqual({ module: 'projects', action: 'updated' });
    expect(describeRoute('PUT', '/projects/:id')).toEqual({ module: 'projects', action: 'updated' });
    expect(describeRoute('DELETE', '/projects/:id')).toEqual({ module: 'projects', action: 'deleted' });
  });

  it('treats a trailing segment as an action only when it follows a parameter', () => {
    // `/organizations/my-organization` is an ordinary update of a resource
    // that happens to be named rather than numbered — not an action called
    // "my-organization".
    expect(describeRoute('PATCH', '/organizations/my-organization')).toEqual({
      module: 'organizations',
      action: 'updated',
    });
    expect(describeRoute('POST', '/auth/invitations')).toEqual({ module: 'auth', action: 'created' });
  });

  it('strips the global prefix Express reports with the route', () => {
    // Without this every entry claimed to be about a module called `api`.
    expect(describeRoute('DELETE', '/api/projects/:id')).toEqual({ module: 'projects', action: 'deleted' });
    expect(describeRoute('POST', '/api/users/:id/deactivate')).toEqual({
      module: 'users',
      action: 'deactivate',
    });
  });

  it('copes with a route it has never seen', () => {
    expect(describeRoute('PATCH', '')).toEqual({ module: 'unknown', action: 'updated' });
  });
});

describe('how loudly an entry reads', () => {
  it('marks the destructive ones', () => {
    expect(severityFor('DELETE', 'deleted')).toBe('warning');
    expect(severityFor('POST', 'deactivate')).toBe('warning');
  });

  it('leaves ordinary changes alone', () => {
    expect(severityFor('POST', 'created')).toBe('info');
    expect(severityFor('PATCH', 'updated')).toBe('info');
  });
});

describe('AuditLogInterceptor', () => {
  let recorded: jest.Mock;
  let interceptor: AuditLogInterceptor;

  const run = (request: Record<string, unknown>, statusCode = 200) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ statusCode }),
      }),
    } as never;

    return new Promise((resolve) =>
      interceptor.intercept(context, { handle: () => of({ id: 'p1' }) }).subscribe(resolve),
    );
  };

  const signedIn = (over: Record<string, unknown> = {}) => ({
    method: 'PATCH',
    route: { path: '/projects/:id' },
    params: { id: 'p1' },
    user: {
      id: 'u1',
      firstName: 'Bat',
      lastName: 'Dorj',
      role: 'organization_admin',
      organizationId: 'org-1',
    },
    ...over,
  });

  beforeEach(() => {
    recorded = jest.fn().mockResolvedValue(null);
    interceptor = new AuditLogInterceptor({ record: recorded } as unknown as AuditLogService);
  });

  it('records who changed what, from the token and the route', async () => {
    await run(signedIn());

    expect(recorded).toHaveBeenCalledWith({
      organizationId: 'org-1',
      actorId: 'u1',
      actorName: 'Bat Dorj',
      actorRole: 'organization_admin',
      module: 'projects',
      action: 'updated',
      targetId: 'p1',
      method: 'PATCH',
      route: '/projects/:id',
      statusCode: 200,
      severity: 'info',
    });
  });

  it.each(['GET', 'HEAD', 'OPTIONS'])('records nothing for %s', async (method) => {
    await run(signedIn({ method }));

    // A trail that logs every page view buries the changes it exists to show.
    expect(recorded).not.toHaveBeenCalled();
  });

  it('records nothing before somebody belongs to an organization', async () => {
    // Registration and sign-in: there is no organization's trail to write to.
    await run(signedIn({ user: { id: 'u1' } }));
    await run(signedIn({ user: undefined }));

    expect(recorded).not.toHaveBeenCalled();
  });

  it('takes nothing from the request body', async () => {
    await run(signedIn({ body: { password: 'Secret123', role: 'super_admin' } }));

    const entry = JSON.stringify(recorded.mock.calls[0][0]);
    expect(entry).not.toContain('Secret123');
    expect(entry).not.toContain('super_admin');
  });

  it('falls back to the email when a person has no name recorded', async () => {
    await run(signedIn({ user: { id: 'u1', email: 'bat@example.com', organizationId: 'org-1' } }));

    expect(recorded.mock.calls[0][0].actorName).toBe('bat@example.com');
  });

  it('does not fail the request when the entry cannot be written', async () => {
    // A request that succeeded must not be reported as failed because the
    // bookkeeping behind it did. The failure is still logged — captured here
    // rather than printed, so a passing run does not look like a broken one.
    const logged = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    recorded.mockRejectedValue(new Error('database gone'));

    await expect(run(signedIn())).resolves.toEqual({ id: 'p1' });
    await new Promise((resolve) => setImmediate(resolve));

    expect(logged).toHaveBeenCalledWith(expect.stringContaining('database gone'));
    logged.mockRestore();
  });
});
