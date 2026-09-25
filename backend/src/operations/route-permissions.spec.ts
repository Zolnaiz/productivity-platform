import { PATH_METADATA } from '@nestjs/common/constants';
import { PERMISSION_KEY } from '../shared/decorators/permissions.decorator';
import { allPermissions, permissionsFor } from '../shared/roles';
import { UserRole } from '../shared/constants';
import { AttachmentsController } from './attachments.controller';
import { OperationsController } from './operations.controller';

/**
 * Every route says what it needs, and needs something that exists.
 *
 * A permission check is only as good as the decorator on the route. A handler
 * added without one is open to every signed-in member of the organization, and
 * a handler asking for a permission that is not in the table is closed to
 * everybody — both are silent. This walks the controllers and checks each
 * against the table rather than trusting that the decorators were remembered.
 */
const controllers = [OperationsController, AttachmentsController];

const handlersOf = (controller: (typeof controllers)[number]) =>
  Object.getOwnPropertyNames(controller.prototype)
    .filter((name) => name !== 'constructor')
    .map((name) => ({
      name,
      handler: controller.prototype[name],
      controller: controller.name,
    }))
    // Only the ones Nest actually routes to.
    .filter(({ handler }) => Reflect.getMetadata(PATH_METADATA, handler) !== undefined);

const routes = controllers.flatMap(handlersOf);

const permissionOf = (handler: unknown) => Reflect.getMetadata(PERMISSION_KEY, handler) as string | undefined;

describe('operations route permissions', () => {
  it('finds the routes to check', () => {
    // A silent zero here would make the whole check pass for nothing.
    expect(routes.length).toBeGreaterThan(30);
  });

  it.each(routes.map((route) => [`${route.controller}.${route.name}`, route.handler]))(
    '%s names a permission',
    (_name, handler) => {
      expect(permissionOf(handler)).toEqual(expect.any(String));
    },
  );

  it('asks only for permissions the role table defines', () => {
    const known = allPermissions();
    const unknown = routes
      .map((route) => ({ route: `${route.controller}.${route.name}`, permission: permissionOf(route.handler) }))
      .filter(({ permission }) => permission && !known.includes(permission));

    // Jest has no message argument, so the names go in the assertion itself.
    expect({ askingForNothing: unknown }).toEqual({ askingForNothing: [] });
  });

  it('leaves a viewer able to read the plant and unable to change it', () => {
    const viewer = permissionsFor(UserRole.VIEWER);
    const writes = routes
      .map((route) => permissionOf(route.handler))
      .filter((permission): permission is string => Boolean(permission))
      .filter((permission) => !permission.endsWith(':read'));

    expect(writes.length).toBeGreaterThan(10);
    writes.forEach((permission) => expect(viewer).not.toContain(permission));
    expect(viewer).toContain('zones:read');
    expect(viewer).toContain('audits:read');
  });

  it('leaves an organization admin able to reach every route', () => {
    const orgAdmin = permissionsFor(UserRole.ORGANIZATION_ADMIN);

    routes.forEach((route) => {
      expect(orgAdmin).toContain(permissionOf(route.handler));
    });
  });
});
