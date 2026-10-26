/** HTTP methods supported by the client. */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** A single query string value. `null` and `undefined` are skipped. */
export type QueryValue = string | number | boolean | Date | null | undefined;

/** Query string parameters; arrays repeat the key (`?a=1&a=2`). */
export type RequestQuery = Record<string, QueryValue | QueryValue[]>;

/** Options accepted by `rest.get`, `rest.post` and the other shortcuts. */
export interface RequestOptions {
	/**
	 * Request body. Plain objects and arrays are sent as JSON; strings,
	 * `FormData`, `URLSearchParams`, `Blob`, binary buffers and streams are
	 * sent as they are.
	 */
	body?: unknown;
	/** Query string parameters. */
	query?: RequestQuery;
	/** Extra headers. They override the client headers and the secret. */
	headers?: Record<string, string>;
	/** Aborts the request and any pending retry. */
	signal?: AbortSignal;
	/** Per attempt timeout in milliseconds, `0` disables it. Overrides the client option. */
	timeout?: number;
	/** Maximum retries, `0` disables them. Overrides the client option. */
	retries?: number;
	/**
	 * `true` also retries `POST` and `PATCH` on 5xx, timeouts and network
	 * failures; `false` never retries. By default those methods only retry
	 * on `429`.
	 */
	retry?: boolean;
}

/** Full description of a request, as taken by `rest.request`. */
export interface RequestData extends RequestOptions {
	/** HTTP method. */
	method: HTTPMethod;
	/** Path relative to `baseUrl`, e.g. `/coupons/{id}`. */
	route: string;
}
