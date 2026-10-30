import { afterAll, describe, expect, test } from 'bun:test';

import { Elysia } from 'elysia';
import express from 'express';
import Fastify from 'fastify';
import { Hono } from 'hono';

import { Webhooks as ElysiaWebhooks } from '../../src/modules/elysia';
import { Webhooks as ExpressWebhooks } from '../../src/modules/express';
import { Webhooks as FastifyWebhooks } from '../../src/modules/fastify';
import { Webhooks as FetchWebhooks } from '../../src/modules/fetch';
import { Webhooks as HonoWebhooks } from '../../src/modules/hono';
import { Webhooks as NextWebhooks } from '../../src/modules/next';
import { sign } from '../../src/modules/webhooks';

const secret = 'whsec_test';

const servers: { close: () => void }[] = [];

afterAll(() => {
	for (const server of servers) server.close();
});

const delivery = async (type: string, key = secret) => {
	const body = JSON.stringify({ id: 'evt_1', type, data: { ok: true } });

	return { body, signature: await sign({ body, secret: key }) };
};

/** A fresh set of handlers that record what ran. */
const setup = () => {
	const calls: string[] = [];

	return {
		calls,
		options: {
			secret,
			onApplicationApproved: ({ id }: { id: string }) => {
				calls.push(`approved:${id}`);
			},
			onMissionVideoSubmitted: ({ type }: { type: string }) => {
				calls.push(type);
			},
			onEvent: ({ type }: { type: string }) => {
				calls.push(`fallback:${type}`);
			},
		},
	};
};

/** Every adapter, reduced to "send this delivery, get the status". */
const adapters: Record<
	string,
	(
		options: ReturnType<typeof setup>['options'],
	) => (body: string, signature: string) => Promise<number>
> = {
	fetch: (options) => {
		const handler = FetchWebhooks(options);

		return async (body, signature) =>
			(
				await handler(
					new Request('http://localhost/webhooks', {
						method: 'POST',
						body,
						headers: { 'x-conty-signature': signature },
					}),
				)
			).status;
	},
	next: (options) => {
		const handler = NextWebhooks(options);

		return async (body, signature) =>
			(
				await handler(
					new Request('http://localhost/webhooks', {
						method: 'POST',
						body,
						headers: { 'x-conty-signature': signature },
					}),
				)
			).status;
	},
	hono: (options) => {
		const app = new Hono().post('/webhooks', HonoWebhooks(options));

		return async (body, signature) =>
			(
				await app.request('/webhooks', {
					method: 'POST',
					body,
					headers: {
						'content-type': 'application/json',
						'x-conty-signature': signature,
					},
				})
			).status;
	},
	elysia: (options) => {
		const app = new Elysia().post('/webhooks', ElysiaWebhooks(options));

		return async (body, signature) =>
			(
				await app.handle(
					new Request('http://localhost/webhooks', {
						method: 'POST',
						body,
						headers: {
							'content-type': 'application/json',
							'x-conty-signature': signature,
						},
					}),
				)
			).status;
	},
	express: (options) => {
		const app = express().post(
			'/webhooks',
			express.raw({ type: 'application/json' }),
			ExpressWebhooks(options),
		);
		const server = app.listen(0);
		const { port } = server.address() as { port: number };

		servers.push(server);

		return async (body, signature) => {
			const response = await fetch(`http://localhost:${port}/webhooks`, {
				method: 'POST',
				body,
				headers: {
					'content-type': 'application/json',
					'x-conty-signature': signature,
				},
			});

			return response.status;
		};
	},
	fastify: (options) => {
		const app = Fastify();

		app.register(FastifyWebhooks, { ...options, path: '/webhooks' });

		return async (body, signature) =>
			(
				await app.inject({
					method: 'POST',
					url: '/webhooks',
					payload: body,
					headers: {
						'content-type': 'application/json',
						'x-conty-signature': signature,
					},
				})
			).statusCode;
	},
};

describe.each(Object.entries(adapters))('%s adapter', (_name, adapter) => {
	test('runs the handler of the event type and answers 200', async () => {
		const { calls, options } = setup();
		const { body, signature } = await delivery('application.approved');

		expect(await adapter(options)(body, signature)).toBe(200);
		expect(calls).toEqual(['approved:evt_1']);
	});

	test('maps snake_case types to the handler name', async () => {
		const { calls, options } = setup();
		const { body, signature } = await delivery('mission.video_submitted');

		expect(await adapter(options)(body, signature)).toBe(200);
		expect(calls).toEqual(['mission.video_submitted']);
	});

	test('onEvent only runs when there is no specific handler', async () => {
		const { calls, options } = setup();
		const { body, signature } = await delivery('mission.expired');

		expect(await adapter(options)(body, signature)).toBe(200);
		expect(calls).toEqual(['fallback:mission.expired']);
	});

	test('answers 200 for an event with no handler at all', async () => {
		const { calls, options } = setup();
		const { onEvent: _, ...withoutFallback } = options;
		const { body, signature } = await delivery('mission.expired');

		expect(await adapter(withoutFallback)(body, signature)).toBe(200);
		expect(calls).toEqual([]);
	});

	test('answers 400 and runs nothing for a bad signature or body', async () => {
		const { calls, options } = setup();
		const forged = await delivery('application.approved', 'whsec_other');
		const send = adapter(options);

		expect(await send(forged.body, forged.signature)).toBe(400);
		expect(await send(`${forged.body} `, forged.signature)).toBe(400);
		expect(calls).toEqual([]);
	});

	test('answers 500 and calls onError when a handler throws', async () => {
		const { calls, options } = setup();
		const errors: unknown[] = [];
		const { body, signature } = await delivery('application.approved');

		const status = await adapter({
			...options,
			onApplicationApproved: () => {
				throw new Error('boom');
			},
			onError: (error: unknown) => {
				errors.push(error);
			},
		} as typeof options)(body, signature);

		expect(status).toBe(500);
		expect(errors).toHaveLength(1);
		expect(calls).toEqual([]);
	});
});

describe('express', () => {
	test('answers 500 when the body was already parsed', async () => {
		const app = express()
			.use(express.json())
			.post('/webhooks', ExpressWebhooks(setup().options));
		const server = app.listen(0);
		const { port } = server.address() as { port: number };
		const { body, signature } = await delivery('application.approved');

		servers.push(server);

		const response = await fetch(`http://localhost:${port}/webhooks`, {
			method: 'POST',
			body,
			headers: {
				'content-type': 'application/json',
				'x-conty-signature': signature,
			},
		});

		expect(response.status).toBe(500);
		expect(await response.text()).toContain('express.raw');
	});
});

describe('fetch runtimes', () => {
	test('accepts the { request } object of SvelteKit, Astro or Remix', async () => {
		const { calls, options } = setup();
		const { body, signature } = await delivery('application.approved');

		const response = await FetchWebhooks(options)({
			request: new Request('http://localhost/webhooks', {
				method: 'POST',
				body,
				headers: { 'x-conty-signature': signature },
			}),
		});

		expect(response.status).toBe(200);
		expect(calls).toEqual(['approved:evt_1']);
	});

	test('builds the options from env, the way Cloudflare Workers does', async () => {
		const { calls, options } = setup();
		const { secret: _, ...handlers } = options;
		const worker = {
			fetch: FetchWebhooks((env: { CONTY_WEBHOOK_SECRET: string }) => ({
				...handlers,
				secret: env.CONTY_WEBHOOK_SECRET,
			})),
		};
		const { body, signature } = await delivery('application.approved');
		const send = (env: { CONTY_WEBHOOK_SECRET: string }) =>
			worker.fetch(
				new Request('http://localhost/webhooks', {
					method: 'POST',
					body,
					headers: { 'x-conty-signature': signature },
				}),
				env,
			);

		expect((await send({ CONTY_WEBHOOK_SECRET: secret })).status).toBe(200);
		expect(
			(await send({ CONTY_WEBHOOK_SECRET: 'whsec_other' })).status,
		).toBe(400);
		expect(calls).toEqual(['approved:evt_1']);
	});
});
