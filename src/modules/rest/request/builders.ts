import { USER_AGENT } from '../constants';
import type { QueryValue, RequestQuery } from '../types';

const trimSlashes = (value: string) => {
	let start = 0;
	let end = value.length;

	while (start < end && value[start] === '/') start++;
	while (end > start && value[end - 1] === '/') end--;

	return value.slice(start, end);
};

const serialize = (value: NonNullable<QueryValue>) =>
	value instanceof Date ? value.toISOString() : String(value);

/** Joins the base URL and the route, then appends the query. */
export const buildUrl = (
	baseUrl: string,
	route: string,
	query: RequestQuery = {},
): string => {
	const url = new URL(`${trimSlashes(baseUrl)}/${trimSlashes(route)}`);

	for (const [key, value] of Object.entries(query)) {
		for (const item of [value].flat()) {
			if (item != null) url.searchParams.append(key, serialize(item));
		}
	}

	return url.toString();
};

/** Later header groups override earlier ones. */
export const buildHeaders = (
	secret?: string,
	contentType?: string,
	...groups: (Record<string, string> | undefined)[]
): Headers => {
	const headers = new Headers({
		accept: 'application/json',
		'user-agent': USER_AGENT,
	});

	if (contentType) headers.set('content-type', contentType);

	if (secret) headers.set('authorization', `Bearer ${secret}`);

	for (const group of groups) {
		for (const [key, value] of Object.entries(group ?? {})) {
			headers.set(key, value);
		}
	}

	return headers;
};

/** Plain objects become JSON; strings and binary/form/stream bodies pass through. */
export const buildBody = (
	body: unknown,
): { body?: BodyInit; contentType?: string } => {
	if (body === undefined) return {};

	if (
		typeof body === 'string' ||
		body instanceof FormData ||
		body instanceof URLSearchParams ||
		body instanceof Blob ||
		body instanceof ArrayBuffer ||
		body instanceof ReadableStream ||
		ArrayBuffer.isView(body)
	) {
		return { body: body as BodyInit };
	}

	return { body: JSON.stringify(body), contentType: 'application/json' };
};

/** Aborts on the caller signal or when the timeout elapses (`0` disables it). */
export const buildSignal = (timeout: number, signal?: AbortSignal) =>
	AbortSignal.any(
		[signal, timeout > 0 ? AbortSignal.timeout(timeout) : undefined].filter(
			(item) => item !== undefined,
		),
	);
