import { describe, expect, test } from 'bun:test';

import { createRest, json } from './helpers';

describe('hooks', () => {
	test('fire in order across retries', async () => {
		const events: string[] = [];
		const { rest } = createRest(
			(_, i) => (i === 0 ? new Response('', { status: 503 }) : json({})),
			{
				hooks: {
					onRequest: ({ attempt }) =>
						events.push(`request:${attempt}`),
					onResponse: ({ attempt, status }) =>
						events.push(`response:${attempt}:${status}`),
					onRetry: ({ attempt, error }) =>
						events.push(`retry:${attempt}:${error.status}`),
					onError: () => events.push('error'),
				},
			},
		);

		await rest.get('/x');

		expect(events).toEqual([
			'request:1',
			'response:1:503',
			'retry:1:503',
			'request:2',
			'response:2:200',
		]);
	});

	test('onError receives the final failure once', async () => {
		let errors = 0;
		const { rest } = createRest(() => new Response('', { status: 404 }), {
			hooks: { onError: () => errors++ },
		});

		await rest.get('/x');

		expect(errors).toBe(1);
	});

	test('a throwing hook never breaks the request', async () => {
		const { rest } = createRest(() => json({ ok: 1 }), {
			hooks: {
				onRequest: () => {
					throw new Error('boom');
				},
			},
		});
		const result = await rest.get('/x');

		expect(result.ok).toBe(true);
	});
});
