import type { RESTResult } from '../modules/rest';

/**
 * What a client method returns: a promise of the `RESTResult` to narrow with
 * `result.ok`, plus `unwrap()` to get the data and throw a `ContyError` on failure.
 */
export type ContyResponse<T> = Promise<RESTResult<T>> & {
	/** Resolves with the data of a successful result, or rejects with a `ContyError`. */
	unwrap(): Promise<T>;
};
