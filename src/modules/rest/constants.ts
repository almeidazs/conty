import { version } from '../../version';
import type { HTTPMethod } from './types';

/** Conty public API root (v1), used when `baseUrl` is not set. */
export const DEFAULT_BASE_URL = 'https://api.appconty.com/public/v1';

/** Sent as `user-agent` on every request (override it through `headers`). */
export const USER_AGENT = `contyos/${version}`;

/** Per attempt timeout in milliseconds. */
export const DEFAULT_TIMEOUT = 15_000;

/** Retries after the first attempt. */
export const DEFAULT_RETRIES = 3;

/** Delay of the first retry in milliseconds, doubled on each attempt. */
export const DEFAULT_BACKOFF_BASE = 500;

/** Upper bound of a single backoff delay in milliseconds. */
export const DEFAULT_BACKOFF_MAX = 10_000;

/** A `Retry-After` above this (milliseconds) fails fast instead of waiting. */
export const MAX_RETRY_AFTER = 60_000;

/** Methods that are safe to repeat after a failure. */
export const IDEMPOTENT_METHODS: ReadonlySet<HTTPMethod> = new Set([
	'GET',
	'PUT',
	'DELETE',
]);

/** HTTP statuses worth retrying (`429` is retried for every method). */
export const RETRY_STATUSES: ReadonlySet<number> = new Set([
	408, 429, 500, 502, 503, 504,
]);
