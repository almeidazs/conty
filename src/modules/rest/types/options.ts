import type { RESTHooks } from './hooks';

/** Minimal `fetch` signature, so custom implementations don't need extras. */
export type FetchLike = (
	input: string,
	init?: RequestInit,
) => Promise<Response>;

/** Exponential backoff between retries (the delay doubles each attempt). */
export interface BackoffOptions {
	/** Delay of the first retry in milliseconds. @default 500 */
	base?: number;
	/** Upper bound of a single delay in milliseconds. @default 10000 */
	max?: number;
}

/** Options of the `REST` client. */
export interface RESTOptions {
	/** API root. @default 'https://api.appconty.com/public/v1' */
	baseUrl?: string;
	/** API key (`ck_live_...`), sent as `Authorization: Bearer <secret>`. */
	secret?: string;
	/** Headers sent on every request. */
	headers?: Record<string, string>;
	/** Per attempt timeout in milliseconds, `0` disables it. @default 15000 */
	timeout?: number;
	/** Maximum retries after the first attempt, `0` disables them. @default 3 */
	retries?: number;
	/** Delay between retries. */
	backoff?: BackoffOptions;
	/** Custom `fetch` (tests, proxies). @default globalThis.fetch */
	fetch?: FetchLike;
	/** Observability hooks. */
	hooks?: RESTHooks;
}
