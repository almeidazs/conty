import { REST, type FetchLike, type RESTOptions } from '../../src/modules/rest';

export interface Call {
	url: string;
	init?: RequestInit;
}

type Handler = (call: Call, index: number) => Response | Promise<Response>;

export const json = (body: unknown, init: ResponseInit = {}) =>
	new Response(JSON.stringify(body), {
		...init,
		headers: { 'content-type': 'application/json', ...init.headers },
	});

export const createRest = (handler: Handler, options: RESTOptions = {}) => {
	const calls: Call[] = [];
	const fetch: FetchLike = async (url, init) => {
		const call = { url, init };

		calls.push(call);

		return handler(call, calls.length - 1);
	};
	const rest = new REST({
		backoff: { base: 1, max: 2 },
		fetch,
		...options,
	});

	return { rest, calls };
};

export const headersOf = (call?: Call): Headers =>
	new Headers(call?.init?.headers);

export const signalOf = (call: Call): AbortSignal => {
	if (!call.init?.signal) throw new Error('missing signal');

	return call.init.signal;
};
