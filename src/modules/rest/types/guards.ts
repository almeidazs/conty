import type { APIErrorCode, APIErrorDetailsOf } from '../../types';
import type { ContyError } from '../ContyError';
import type { RESTError, RESTFailure, RESTResult } from './result';

/** A failed result whose API error has this `code`, with `details` typed for it. */
export type RESTFailureWith<Code extends APIErrorCode = APIErrorCode> =
	RESTFailure & {
		error: RESTError & {
			type: 'http';
			code: Code;
			details: APIErrorDetailsOf<Code>;
		};
	};

/** A thrown `ContyError` with this `code`, with `details` typed for it. */
export type ContyErrorWith<Code extends APIErrorCode = APIErrorCode> =
	ContyError & { code: Code; details: APIErrorDetailsOf<Code> };

/** Narrows a result, or a caught error, to an API error, optionally with a given `code`. */
export interface IsContyError {
	<Code extends APIErrorCode = APIErrorCode>(
		value: RESTResult<unknown>,
		code?: Code,
	): value is RESTFailureWith<Code>;
	<Code extends APIErrorCode = APIErrorCode>(
		value: unknown,
		code?: Code,
	): value is ContyErrorWith<Code>;
}

/** `isContyError` with the `code` already fixed. */
export interface IsContyErrorCode<Code extends APIErrorCode> {
	(value: RESTResult<unknown>): value is RESTFailureWith<Code>;
	(value: unknown): value is ContyErrorWith<Code>;
}
