import type { APIErrorCode, APIErrorDetail } from '../../types';

/**
 * - `http`: the server answered with a non 2xx status
 * - `timeout`: the attempt exceeded its timeout
 * - `network`: the request could not be completed (DNS, connection, ...)
 * - `aborted`: the caller's `signal` was aborted
 */
export type RESTErrorType = 'http' | 'timeout' | 'network' | 'aborted';

/** Why a request failed. */
export interface RESTError {
	/** Failure category. */
	type: RESTErrorType;
	/** Message of Conty's error envelope when there is one, else a generic description. */
	message: string;
	/** HTTP status, only for `http` errors. */
	status?: number;
	/** Parsed response body, only for `http` errors. */
	body?: unknown;
	/** Stable error code of Conty's envelope, only for `http` errors. Handle errors by it. */
	code?: APIErrorCode;
	/** Per field details of Conty's envelope (`validation_failed`, `coupon_exists`). */
	details?: APIErrorDetail[];
	/** Request id of Conty's envelope, to send to support. */
	requestId?: string;
	/** Milliseconds the server asked to wait (`Retry-After`). */
	retryAfter?: number;
	/** Original error, for `timeout`, `network` and `aborted`. */
	cause?: unknown;
}

/** A 2xx response. */
export interface RESTSuccess<T = unknown> {
	ok: true;
	/** Parsed body: JSON or text, `undefined` when empty. */
	data: T;
	/** HTTP status. */
	status: number;
	/** Response headers. */
	headers: Headers;
}

/** A failed request, after retries. */
export interface RESTFailure {
	ok: false;
	error: RESTError;
	/** HTTP status, present when the server answered. */
	status?: number;
	/** Response headers, present when the server answered. */
	headers?: Headers;
}

/** Outcome of a request. Requests never throw: narrow with `result.ok`. */
export type RESTResult<T = unknown> = RESTSuccess<T> | RESTFailure;
