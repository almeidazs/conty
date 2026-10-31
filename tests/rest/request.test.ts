import { describe, expect, test } from 'bun:test';

import { createRest, headersOf, json } from './helpers';

describe('request', () => {
	test('returns parsed data, status and headers', async () => {
		const { rest } = createRest(() => json({ id: '1' }, { status: 201 }));
		const result = await rest.get<{ id: string }>('/users');

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data).toEqual({ id: '1' });
			expect(result.status).toBe(201);
			expect(result.headers.get('content-type')).toBe('application/json');
		}
	});

	test('builds the url with baseUrl, route and query', async () => {
		const { rest, calls } = createRest(() => json({}), {
			baseUrl: 'https://example.test/v1/',
		});

		await rest.get('users/', {
			query: { a: 1, b: [1, 2], c: undefined, d: null, e: true },
		});

		expect(calls[0]?.url).toBe(
			'https://example.test/v1/users?a=1&b=1&b=2&e=true',
		);
	});

	test('trims boundary slashes while preserving internal slashes', async () => {
		const { rest, calls } = createRest(() => json({}), {
			baseUrl: 'https://example.test/v1///',
		});

		await rest.get(`${'/'.repeat(10000)}users//profile///`);
		await rest.get('////');
		const internalSlashes = '/'.repeat(100000);
		await rest.get(`users${internalSlashes}profile`);

		expect(calls[0]?.url).toBe('https://example.test/v1/users//profile');
		expect(calls[1]?.url).toBe('https://example.test/v1/');
		expect(calls[2]?.url).toBe(
			`https://example.test/v1/users${internalSlashes}profile`,
		);
	});

	test('defaults to the Conty API', async () => {
		const { rest, calls } = createRest(() => json({}));

		await rest.get('/me');

		expect(calls[0]?.url).toBe('https://api.appconty.com/public/v1/me');
	});

	test('sends bearer auth, user agent and merged headers', async () => {
		const { rest, calls } = createRest(() => json({}), {
			secret: 's3',
			headers: { 'x-a': 'client', 'x-b': 'client' },
		});

		await rest.get('/x', { headers: { 'x-b': 'request' } });

		const headers = headersOf(calls[0]);

		expect(headers.get('authorization')).toBe('Bearer s3');
		expect(headers.get('user-agent')).toStartWith('contyos/');
		expect(headers.get('x-a')).toBe('client');
		expect(headers.get('x-b')).toBe('request');
	});

	test('setSecret replaces the secret and headers override it', async () => {
		const { rest, calls } = createRest(() => json({}), { secret: 's3' });

		rest.setSecret('next');
		await rest.get('/x');
		await rest.get('/x', { headers: { authorization: 'Custom y' } });

		expect(headersOf(calls[0]).get('authorization')).toBe('Bearer next');
		expect(headersOf(calls[1]).get('authorization')).toBe('Custom y');
	});

	test('serializes objects as JSON and passes raw bodies through', async () => {
		const { rest, calls } = createRest(() => json({}));

		await rest.post('/x', { body: { a: 1 } });
		await rest.post('/x', { body: 'raw' });

		const first = calls[0]?.init;
		const second = calls[1]?.init;

		expect(first?.body).toBe('{"a":1}');
		expect(headersOf(calls[0]).get('content-type')).toBe(
			'application/json',
		);
		expect(second?.body).toBe('raw');
		expect(headersOf(calls[1]).has('content-type')).toBe(false);
	});

	test('uses the right method for each shortcut', async () => {
		const { rest, calls } = createRest(() => json({}));

		await rest.get('/x');
		await rest.post('/x');
		await rest.put('/x');
		await rest.patch('/x');
		await rest.delete('/x');

		expect(calls.map((call) => call.init?.method)).toEqual([
			'GET',
			'POST',
			'PUT',
			'PATCH',
			'DELETE',
		]);
	});

	test('204 and empty bodies resolve to undefined data', async () => {
		const { rest } = createRest(() => new Response(null, { status: 204 }));
		const result = await rest.delete('/x');

		expect(result.ok && result.data).toBeUndefined();
	});

	test('non JSON bodies resolve to text', async () => {
		const { rest } = createRest(() => new Response('pong'));
		const result = await rest.get('/ping');

		expect(result.ok && result.data).toBe('pong');
	});

	test('4xx is a failure, never thrown, and is not retried', async () => {
		const envelope = {
			error: {
				code: 'not_found',
				message: 'Recurso não encontrado.',
				details: [{ message: 'missing' }],
				request_id: 'req_1',
			},
		};
		const { rest, calls } = createRest(() =>
			json(envelope, { status: 404 }),
		);
		const result = await rest.get('/x');

		expect(calls).toHaveLength(1);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.status).toBe(404);
			expect(result.error).toMatchObject({
				type: 'http',
				status: 404,
				code: 'not_found',
				message: 'Recurso não encontrado.',
				details: [{ message: 'missing' }],
				requestId: 'req_1',
				body: envelope,
			});
		}
	});
});
