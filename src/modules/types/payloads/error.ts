import type { ID } from '../common';

/** Stable error code. Handle errors by `code`, never by `message`. */
export type APIErrorCode =
	| 'invalid_api_key'
	| 'open_api_disabled'
	| 'plan_required'
	| 'coupons_disabled'
	| 'forbidden'
	| 'not_found'
	| 'coupon_exists'
	| 'coupon_code_taken'
	| 'coupon_canceled'
	| 'coupon_assigned'
	| 'coupon_campaign_mismatch'
	| 'sale_occurred_at_out_of_range'
	| 'validation_failed'
	| 'mission_closed'
	| 'rate_limited'
	| 'internal_error';

/** Per field (or per resource) detail of an error. */
export interface APIErrorDetail {
	/** Field that caused the error, when there is one. */
	path?: string;
	/** What is wrong with the field. */
	message: string;
	/** Id of the existing active coupon, on `coupon_exists`. */
	coupon_id?: ID;
}

/** The error object inside the envelope. */
export interface APIError {
	/** Stable code to handle in your own code. */
	code: APIErrorCode;
	/** Human readable message in Portuguese. May change, don't compare with it. */
	message: string;
	/** On `validation_failed`, one item per invalid field. */
	details?: APIErrorDetail[];
	/** Request id, to send to support. */
	request_id: string;
}

/** Body of every non 2xx response. */
export interface APIErrorEnvelope {
	error: APIError;
}
