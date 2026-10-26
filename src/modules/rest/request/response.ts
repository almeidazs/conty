import type { APIError } from '../../types';
import { parseRetryAfter } from '../retry/policy';
import type { RESTFailure, RESTSuccess } from '../types';

/** Reads the body as JSON when declared (falling back to text), else as text. */
export const parseResponse = async (response: Response): Promise<unknown> => {
	const text = await response.text();

	if (!text) return undefined;

	if (!response.headers.get('content-type')?.includes('json')) return text;

	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
};

export const success = <T>(
	response: Response,
	data: unknown,
): RESTSuccess<T> => ({
	ok: true,
	data: data as T,
	status: response.status,
	headers: response.headers,
});

/** Reads Conty's error envelope (`{ error: { code, message, ... } }`) when there is one. */
const readAPIError = (body: unknown): APIError | undefined => {
	const error = (body as { error?: APIError } | null)?.error;

	return typeof error?.code === 'string' ? error : undefined;
};

export const httpFailure = (response: Response, body: unknown): RESTFailure => {
	const { status, headers } = response;
	const apiError = readAPIError(body);

	return {
		ok: false,
		status,
		headers,
		error: {
			type: 'http',
			message:
				apiError?.message ??
				`HTTP ${status} ${response.statusText}`.trim(),
			status,
			body,
			code: apiError?.code,
			details: apiError?.details,
			requestId: apiError?.request_id,
			retryAfter: parseRetryAfter(headers.get('retry-after')),
		},
	};
};

/** Classifies a thrown error: caller abort, timeout or network failure. */
export const toFailure = (
	cause: unknown,
	signal?: AbortSignal,
): RESTFailure => {
	const name = cause instanceof Error ? cause.name : undefined;
	const type = signal?.aborted
		? 'aborted'
		: name === 'TimeoutError'
			? 'timeout'
			: 'network';

	return {
		ok: false,
		error: {
			type,
			message: cause instanceof Error ? cause.message : String(cause),
			cause,
		},
	};
};
