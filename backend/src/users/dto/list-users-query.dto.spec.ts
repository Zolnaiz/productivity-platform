import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserRole } from '../../shared/constants';
import { ListUsersQueryDto } from './list-users-query.dto';

const parse = (query: Record<string, unknown>) =>
  plainToInstance(ListUsersQueryDto, query, { enableImplicitConversion: true });

describe('ListUsersQueryDto', () => {
  it('turns the query string into numbers', async () => {
    const dto = parse({ page: '3', limit: '50' });

    expect(await validate(dto)).toEqual([]);
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(50);
  });

  it('supplies defaults when the caller passes nothing', async () => {
    const dto = parse({});

    expect(await validate(dto)).toEqual([]);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('refuses a page size that would return the whole table', async () => {
    const errors = await validate(parse({ limit: '5000' }));

    expect(errors.map((error) => error.property)).toContain('limit');
  });

  it('refuses a role that is not a role', async () => {
    const errors = await validate(parse({ role: 'root' }));

    expect(errors.map((error) => error.property)).toContain('role');
  });

  it('accepts a real role', async () => {
    expect(await validate(parse({ role: UserRole.MANAGER }))).toEqual([]);
  });
});
