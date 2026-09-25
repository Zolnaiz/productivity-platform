import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { PermissionsGuard } from '../shared/guards/permissions.guard';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Proves the module's dependency graph resolves.
 *
 * This module existed, guarded and decorated, for a long time without being in
 * `AppModule` — so every route on it returned 404 while the code read as
 * though the API were finished. A wiring test is what turns "the controller
 * exists" into "the controller is reachable".
 */
describe('UsersModule wiring', () => {
  const build = () =>
    Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        // The controller is guarded at class level, so the guard is part of
        // the graph the application actually builds.
        PermissionsGuard,
        {
          provide: getRepositoryToken(User),
          useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile();

  it('constructs the controller and its service', async () => {
    const moduleRef = await build();

    expect(moduleRef.get(UsersController)).toBeInstanceOf(UsersController);
    expect(moduleRef.get(UsersService)).toBeInstanceOf(UsersService);
    expect(moduleRef.get(PermissionsGuard)).toBeInstanceOf(PermissionsGuard);

    await moduleRef.close();
  });

  it('is registered in the application module', () => {
    // The failure this catches is not a broken import but a missing one.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AppModule } = require('../app.module');
    const imports = Reflect.getMetadata('imports', AppModule) as unknown[];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { UsersModule } = require('./users.module');
    expect(imports).toContain(UsersModule);
  });
});
