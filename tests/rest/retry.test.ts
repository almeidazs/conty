import { describe, expect, test } from 'bun:test';

import { createRest, json } from './helpers';

const fail = (status: number, headers?: Record<string, string>) =>
	new Response('', { status, headers });

describe('retry', () => {
	test('retries idempotent methods on 5xx until success', async () => {
		const { rest, calls } = createRest((_, i) =>
			i < 2 ? fail(503) : json({ ok: true }),
		);
		const result = await rest.get('/x');

		expect(result.ok).toBe(true);
		expect(calls).toHaveLength(3);
	});

	test('gives up after the configured retries', async () => {
		const { rest, calls } = createRest(() => fail(500), { retries: 2 });
		const result = await rest.get('/x');

		expect(calls).toHaveLength(3);
		expect(result.ok).toBe(false);
	});

	test('retries: 0 disables retries', async () => {
		const { rest, calls } = createRest(() => fail(500));

		await rest.get('/x', { retries: 0 });

		expect(calls).toHaveLength(1);
	});

	test('POST is not retried on 5xx, but is on 429', async () => {
		const server = createRest(() => fail(503));
		await server.rest.post('/x');
		expect(server.calls).toHaveLength(1);

		const limited = createRest((_, i) =>
			i === 0 ? fail(429, { 'retry-after': '0' }) : json({}),
		);
		const result = await limited.rest.post('/x');
		expect(result.ok).toBe(true);
		expect(limited.calls).toHaveLength(2);
	});

	test('retry: true retries POST on 5xx and retry: false never retries', async () => {
		const forced = createRest((_, i) => (i === 0 ? fail(502) : json({})));
		await forced.rest.post('/x', { retry: true });
		expect(forced.calls).toHaveLength(2);

		const never = createRest(() => fail(429, { 'retry-after': '0' }));
		await never.rest.get('/x', { retry: false });
		expect(never.calls).toHaveLength(1);
	});

	test('honors Retry-After', async () => {
		const { rest } = createRest((_, i) =>
			i === 0 ? fail(429, { 'retry-after': '0.05' }) : json({}),
		);
		const start = performance.now();

		await rest.get('/x');

		expect(performance.now() - start).toBeGreaterThanOrEqual(45);
	});

	test('does not wait for an excessive Retry-After', async () => {
		const { rest, calls } = createRest(() =>
			fail(429, { 'retry-after': '3600' }),
		);
		const result = await rest.get('/x');

		expect(calls).toHaveLength(1);
		expect(!result.ok && result.error.retryAfter).toBe(3_600_000);
	});

	test('retries network errors on idempotent methods', async () => {
		const { rest, calls } = createRest((_, i) => {
			if (i === 0) throw new TypeError('socket closed');

			return json({});
		});
		const result = await rest.get('/x');

		expect(result.ok).toBe(true);
		expect(calls).toHaveLength(2);
	});

	test('reports a network failure when retries run out', async () => {
		const { rest } = createRest(
			() => {
				throw new TypeError('socket closed');
			},
			{ retries: 1 },
		);
		const result = await rest.get('/x');

		expect(!result.ok && result.error).toMatchObject({
			type: 'network',
			message: 'socket closed',
		});
	});

	test('streams are never retried', async () => {
		const { rest, calls } = createRest(() => fail(503));

		await rest.put('/x', {
			body: new ReadableStream({
				start(controller) {
					controller.close();
				},
			}),
		});

		expect(calls).toHaveLength(1);
	});
});
