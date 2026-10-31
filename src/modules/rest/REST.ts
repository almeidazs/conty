import {
	DEFAULT_BACKOFF_BASE,
	DEFAULT_BACKOFF_MAX,
	DEFAULT_BASE_URL,
	DEFAULT_RETRIES,
	DEFAULT_TIMEOUT,
} from './constants';
import {
	buildBody,
	buildHeaders,
	buildSignal,
	buildUrl,
} from './request/builders';
import {
	httpFailure,
	parseResponse,
	success,
	toFailure,
} from './request/response';
import { getBackoff, shouldRetry } from './retry/policy';
import { sleep } from './retry/sleep';
import type {
	RequestData,
	RequestHookContext,
	RequestOptions,
	RESTHooks,
	RESTOptions,
	RESTResult,
} from './types';

export class REST {
	private readonly options: RESTOptions;
	private secret?: string;

	constructor(options: RESTOptions = {}) {
		this.options = options;
		this.secret = options.secret;
	}

	/** Replaces the secret used on the next requests. */
	setSecret(secret?: string): this {
		this.secret = secret;

		return this;
	}

	get<T = unknown>(route: string, options?: RequestOptions) {
		return this.request<T>({ ...options, method: 'GET', route });
	}

	post<T = unknown>(route: string, options?: RequestOptions) {
		return this.request<T>({ ...options, method: 'POST', route });
	}

	put<T = unknown>(route: string, options?: RequestOptions) {
		return this.request<T>({ ...options, method: 'PUT', route });
	}

	patch<T = unknown>(route: string, options?: RequestOptions) {
		return this.request<T>({ ...options, method: 'PATCH', route });
	}

	delete<T = unknown>(route: string, options?: RequestOptions) {
		return this.request<T>({ ...options, method: 'DELETE', route });
	}

	/** Sends a request, retrying on transient failures. Never throws. */
	async request<T = unknown>(data: RequestData): Promise<RESTResult<T>> {
		const { method, route, signal, retry } = data;

		const options = this.options;

		const url = buildUrl(
			options.baseUrl ?? DEFAULT_BASE_URL,
			route,
			data.query,
		);

		const { body, contentType } = buildBody(data.body);

		const init: RequestInit & { duplex?: 'half' } = {
			method,
			body,
			headers: buildHeaders(
				this.secret,
				contentType,
				options.headers,
				data.headers,
			),
		};

		// Streams can only be read once, so they can't be retried.
		const isStream = body instanceof ReadableStream;
		const retries = isStream
			? 0
			: (data.retries ?? options.retries ?? DEFAULT_RETRIES);

		const timeout = data.timeout ?? options.timeout ?? DEFAULT_TIMEOUT;

		if (isStream) init.duplex = 'half';

		for (let attempt = 1; ; attempt++) {
			const context = { method, url, attempt };
			const result = await this.send<T>(context, init, timeout, signal);

			if (result.ok) return result;

			const { error } = result;

			if (attempt > retries || !shouldRetry(method, error, retry)) {
				this.emit('onError', { ...context, error });

				return result;
			}

			const delay =
				error.retryAfter ??
				getBackoff(
					attempt,
					options.backoff?.base ?? DEFAULT_BACKOFF_BASE,
					options.backoff?.max ?? DEFAULT_BACKOFF_MAX,
				);

			this.emit('onRetry', { ...context, delay, error });

			await sleep(delay, signal);
		}
	}

	private async send<T>(
		context: RequestHookContext,
		init: RequestInit,
		timeout: number,
		signal?: AbortSignal,
	): Promise<RESTResult<T>> {
		if (signal?.aborted) return toFailure(signal.reason, signal);

		const startedAt = performance.now();

		this.emit('onRequest', context);

		try {
			const response = await (this.options.fetch ?? fetch)(context.url, {
				...init,
				signal: buildSignal(timeout, signal),
			});

			const body = await parseResponse(response);

			this.emit('onResponse', {
				...context,
				status: response.status,
				duration: performance.now() - startedAt,
			});

			return response.ok
				? success<T>(response, body)
				: httpFailure(response, body);
		} catch (cause) {
			return toFailure(cause, signal);
		}
	}

	/** Hooks must never break a request, so their errors are swallowed. */
	private emit<K extends keyof RESTHooks>(
		hook: K,
		context: Parameters<NonNullable<RESTHooks[K]>>[0],
	) {
		try {
			(
				this.options.hooks?.[hook] as
					| ((context: unknown) => void)
					| undefined
			)?.(context);
		} catch {}
	}
}
