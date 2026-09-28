import { readFileSync } from 'fs';
import { join } from 'path';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { UpsertFiveSLayoutDto } from './operations.dto';

/** The field names of an interface in the web's 5S types. */
const fieldsOf = (name: string) => {
  const source = readFileSync(join(__dirname, '../../../../admin-web/src/types/fiveS.types.ts'), 'utf8').replace(
    /\r\n/g,
    '\n',
  );
  const start = source.indexOf(`export interface ${name} {`);
  const body = source.slice(start, source.indexOf('\n}\n', start));

  return [...body.matchAll(/^ {2}(\w+)\??:/gm)].map((match) => match[1]);
};

/** Every property the validation refused as unknown, with its path. */
const unknownProperties = (errors: ValidationError[], path = ''): string[] =>
  errors.flatMap((error) => [
    ...(error.constraints?.whitelistValidation ? [`${path}${error.property}`] : []),
    ...unknownProperties(error.children ?? [], `${path}${error.property}.`),
  ]);

/**
 * The editor saves the plan it holds, whole, and the API refuses any property
 * it does not know. So every field the web's zone and red tag carry has to be
 * one the plan DTO accepts - or a plan holding one cannot be saved at all.
 * That happened four times over: the server's own audit fields, a zone's
 * department, and a tag's pin and holding dates were each refused, and every
 * save of such a plan failed with a 400 the editor did not show.
 */
describe('the plan the editor saves', () => {
  it('carries nothing the API refuses as unknown', async () => {
    const tag = Object.fromEntries(fieldsOf('FiveSRedTag').map((field) => [field, undefined]));
    const zone = {
      ...Object.fromEntries(fieldsOf('FiveSZone').map((field) => [field, undefined])),
      redTags: [tag],
    };

    const dto = plainToInstance(UpsertFiveSLayoutDto, { name: 'Plan', site: 'HQ', zones: [zone], objects: [] });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

    expect(unknownProperties(errors)).toEqual([]);
  });

  it('reads the web types it checks against', () => {
    // A test that finds no fields passes for the wrong reason.
    expect(fieldsOf('FiveSZone')).toEqual(expect.arrayContaining(['id', 'departmentId', 'redTags', 'tierAudits']));
    expect(fieldsOf('FiveSRedTag')).toEqual(expect.arrayContaining(['id', 'x', 'heldAt', 'closedAt']));
  });
});
