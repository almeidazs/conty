import type { APIErrorCode } from '../types';
import { ContyError } from './ContyError';
import type { IsContyError, IsContyErrorCode, RESTFailure } from './types';

/** The API error code of a failed result or of a thrown `ContyError`. */
const codeOf = (value: unknown) => {
	if (value instanceof ContyError) return value.code;

	const failure = value as Partial<RESTFailure> | null;

	return failure?.ok === false ? failure.error?.code : undefined;
};

/**
 * Tells if a result, or an error caught from `unwrap()`, is an API error, optionally
 * with this `code`, and narrows `details` to what that code carries. Network failures
 * and timeouts have no code, so they are never one.
 */
export const isContyError = ((value: unknown, code?: APIErrorCode) => {
	const found = codeOf(value);

	return found !== undefined && (code === undefined || found === code);
}) as IsContyError;

const is = <Code extends APIErrorCode>(code: Code) =>
	((value: unknown) => isContyError(value, code)) as IsContyErrorCode<Code>;

/** The creator or the campaign already has an active coupon: `details[].coupon_id` has it. */
export const isCouponExists = is('coupon_exists');

/** The resource doesn't exist, or doesn't belong to the brand. */
export const isNotFound = is('not_found');

/** The 120 requests per minute were exceeded: wait `error.retryAfter` ms. */
export const isRateLimited = is('rate_limited');

/** The body or the query is invalid: `details` has one item per field. */
export const isValidationFailed = is('validation_failed');
