import { ValueTransformer } from 'typeorm';

/**
 * A Postgres `numeric` read back as a number.
 *
 * The driver hands `numeric` over as text, to keep precision it cannot
 * promise in a double. Every one of these columns - scores, hours, amounts -
 * fits a double at two decimals, and as text they reached the clients as
 * "40.00": printed as "40.00%", and added up by string concatenation, so an
 * average of two scores read "080.0060.00".
 */
export const numericColumn: ValueTransformer = {
  to: (value: unknown) => value,
  from: (value: unknown) => (value === null || value === undefined ? value : Number(value)),
};
