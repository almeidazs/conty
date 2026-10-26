import type { REST, RESTOptions } from '../modules/rest';

/** Options of the `Conty` client. */
export interface ContyOptions {
	/** Secret used to authenticate against the Conty API. */
	secret?: string;
	/**
	 * Options for the internal `REST` client, or a ready `REST` instance to
	 * share (its secret is replaced when `secret` is also given).
	 */
	rest?: REST | RESTOptions;
}
