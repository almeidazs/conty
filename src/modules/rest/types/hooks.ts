import type { HTTPMethod } from './request';
import type { RESTError } from './result';

/** Data shared by every hook. */
export interface RequestHookContext {
	method: HTTPMethod;
	/** Final URL, query included. */
	url: string;
	/** 1-based attempt number. */
	attempt: number;
}

/** Context of `onResponse`. */
export interface ResponseHookContext extends RequestHookContext {
	/** HTTP status of this attempt. */
	status: number;
	/** Milliseconds spent on this attempt. */
	duration: number;
}

/** Context of `onRetry`. */
export interface RetryHookContext extends RequestHookContext {
	/** Milliseconds until the next attempt. */
	delay: number;
	/** Failure that caused the retry. */
	error: RESTError;
}

/** Context of `onError`. */
export interface ErrorHookContext extends RequestHookContext {
	/** Final failure. */
	error: RESTError;
}

/** Observability hooks. Errors thrown inside them are ignored. */
export interface RESTHooks {
	/** Before each attempt. */
	onRequest?: (context: RequestHookContext) => void;
	/** After each attempt that got a response. */
	onResponse?: (context: ResponseHookContext) => void;
	/** Before waiting for the next attempt. */
	onRetry?: (context: RetryHookContext) => void;
	/** Once, when the request fails for good. */
	onError?: (context: ErrorHookContext) => void;
}
