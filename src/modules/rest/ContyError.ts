import type { APIErrorCode, APIErrorDetail } from '../types';
import type { RESTError, RESTErrorType } from './types';

/**
 * A failed request, thrown instead of returned by `unwrap()`. Handle it by `code` or `status`.
 */
export class ContyError extends Error {
	override readonly name = 'ContyError';

	/** Failure category: `http`, `timeout`, `network` or `aborted`. */
	readonly type: RESTErrorType;

	/** HTTP status, only for `http` errors. */
	readonly status?: number;

	/** Stable error code of Conty's envelope, only for `http` errors. */
	readonly code?: APIErrorCode;

	/** Request id of Conty's envelope, to send to support. */
	readonly requestId?: string;

	/** Per field details of Conty's envelope. */
	readonly details?: APIErrorDetail[];

	/** Milliseconds the server asked to wait (`Retry-After`). */
	readonly retryAfter?: number;

	/** Parsed response body, only for `http` errors. */
	readonly body?: unknown;

	constructor(error: RESTError) {
		super(error.message, { cause: error.cause });

		this.type = error.type;
		this.status = error.status;
		this.code = error.code;
		this.requestId = error.requestId;
		this.details = error.details;
		this.retryAfter = error.retryAfter;
		this.body = error.body;
	}
}
