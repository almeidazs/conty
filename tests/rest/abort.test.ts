import { describe, expect, test } from 'bun:test';

import { createRest, signalOf } from './helpers';

describe('timeout and abort', () => {
	test('times out per attempt and retries', async () => {
		const { rest, calls } = createRest(
			(call) =>
				new Promise<Response>((_, reject) => {
					signalOf(call).addEventListener('abort', () =>
						reject(signalOf(call).reason),
					);
				}),
			{ timeout: 20, retries: 1 },
		);
		const result = await rest.get('/x');

		expect(calls).toHaveLength(2);
		expect(!result.ok && result.error.type).toBe('timeout');
	});

	test('caller signal aborts without retrying', async () => {
		const controller = new AbortController();
		const { rest, calls } = createRest(
			(call) =>
				new Promise<Response>((_, reject) => {
					signalOf(call).addEventListener('abort', () =>
						reject(signalOf(call).reason),
					);
					controller.abort();
				}),
		);
		const result = await rest.get('/x', { signal: controller.signal });

		expect(calls).toHaveLength(1);
		expect(!result.ok && result.error.type).toBe('aborted');
	});

	test('aborting during backoff stops the retry', async () => {
		const controller = new AbortController();
		const { rest, calls } = createRest(
			() => new Response('', { status: 503 }),
			{
				backoff: { base: 5_000, max: 5_000 },
			},
		);
		const pending = rest.get('/x', { signal: controller.signal });

		setTimeout(() => controller.abort(), 20);

		const result = await pending;

		expect(calls).toHaveLength(1);
		expect(!result.ok && result.error.type).toBe('aborted');
	});
});
