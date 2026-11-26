/**
 * Every request body the operations API validates, gathered from the domain
 * files beside this one. Controllers import from here; a new DTO goes in the
 * file of its domain and is re-exported below.
 */
export * from './shared.dto';
export * from './work.dto';
export * from './five-s.dto';
export * from './audit.dto';
export * from './department.dto';
export * from './month-close.dto';
