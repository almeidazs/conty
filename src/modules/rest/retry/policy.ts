import {
	IDEMPOTENT_METHODS,
	MAX_RETRY_AFTER,
	RETRY_STATUSES,
} from '../constants';
import type { HTTPMethod, RESTError } from '../types';

/** Exponential backoff with equal jitter: half fixed, half random. */
export const getBackoff = (attempt: number, base: number, max: number) => {
	const ceiling = Math.min(max, base * 2 ** (attempt - 1));

	return ceiling / 2 + (Math.random() * ceiling) / 2;
};

/** Parses `Retry-After` (seconds or HTTP date) into milliseconds. */
export const parseRetryAfter = (value: string | null) => {
	if (!value) return undefined;

	const seconds = Number(value);
	const ms = Number.isNaN(seconds)
		? Date.parse(value) - Date.now()
		: seconds * 1000;

	return Number.isNaN(ms) ? undefined : Math.max(0, ms);
};

/**
 * `429` is always retried. Other statuses, timeouts and network failures are
 * retried only for idempotent methods, unless `retry` overrides it.
 */
export const shouldRetry = (
	method: HTTPMethod,
	{ type, status, retryAfter = 0 }: RESTError,
	retry?: boolean,
) => {
	if (type === 'aborted' || retry === false || retryAfter > MAX_RETRY_AFTER) {
		return false;
	}

	if (status === 429) return true;

	return (
		(retry || IDEMPOTENT_METHODS.has(method)) &&
		(!status || RETRY_STATUSES.has(status))
	);
};
