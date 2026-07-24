import type { DriverActionPort } from './types.ts';

/** Production actions — real uploads stay in submission pages, not this port. */
export function createProductionDriverActionPort(): DriverActionPort {
  return {
    mode: 'production',
  };
}
