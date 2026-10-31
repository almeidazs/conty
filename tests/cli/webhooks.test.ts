import { afterAll, describe, expect, test } from 'bun:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { sign, verify } from '../../src/modules/webhooks';
import { setup, start } from './helpers';

const secret = 'whsec_test';
const env = { CONTY_WEBHOOK_SECRET: secret };

const events = [
	'application.created',
	'application.approved',
	'application.rejected',
	'mission.accepted',
	'mission.script_submitted',
	'mission.cover_submitted',
	'mission.caption_submitted',
	'mission.video_submitted',
	'mission.post_link_added',
	'mission.changes_requested',
	'mission.approved',
	'mission.rejected',
	'mission.expired',
	'mission.canceled',
	'webhook.test',
];

interface Delivery {
	body: string;
	headers: Headers;
}

const servers: { stop: () => void }[] = [];

afterAll(() => {
	for (const server of servers) server.stop();
});

/** A local app that records every delivery and answers with `status`. */
const app = (status = 200) => {
	const deliveries: Delivery[] = [];
	const server = Bun.serve({
		port: 0,
		fetch: async (request) => {
			deliveries.push({
				body: await request.text(),
				headers: request.headers,
			});

			return new Response(status === 200 ? 'ok' : 'falhou', { status });
		},
	});

	servers.push(server);

	return {
		deliveries,
		url: `http://127.0.0.1:${server.port}/webhooks/conty`,
	};
};

const signed = (delivery?: Delivery, key = secret) =>
	verify({
		body: delivery?.body ?? '',
		header: delivery?.headers.get('x-conty-signature'),
		secret: key,
	});

describe('trigger', () => {
	test('sends a signed event with the headers Conty sends', async () => {
		const h = await setup();
		const target = app();
		const result = await h.cli(
			['trigger', 'application.approved', '--url', target.url],
			{ env },
		);

		expect(result.code).toBe(0);
		expect(JSON.parse(result.out)).toMatchObject({ status: 200 });

		const [delivery] = target.deliveries;
		const event = JSON.parse(delivery?.body ?? '');

		expect(event).toMatchObject({
			type: 'application.approved',
			tenant: 'conty',
			data: {
				mission: { id: expect.any(String) },
				creator: { name: expect.any(String) },
			},
		});
		expect(delivery?.headers.get('x-conty-event')).toBe(
			'application.approved',
		);
		expect(delivery?.headers.get('x-conty-event-id')).toBe(event.id);
		expect(delivery?.headers.get('x-conty-delivery')).toBeTruthy();
		expect(delivery?.headers.get('user-agent')).toBe('Conty-Webhooks/1.0');
		expect(await signed(delivery)).toBe(true);
	});

	test('every event of the SDK has a fixture that goes out', async () => {
		const h = await setup();
		const target = app();

		for (const type of events)
			expect(
				(await h.cli(['trigger', type, '--url', target.url], { env }))
					.code,
			).toBe(0);

		const sent = target.deliveries.map(({ body }) => JSON.parse(body));

		expect(sent.map((event) => event.type)).toEqual(events);
		expect(new Set(sent.map((event) => event.id)).size).toBe(events.length);
	});

	test('--set and --data change the event', async () => {
		const h = await setup();
		const target = app();
		const file = join(
			await mkdtemp(join(tmpdir(), 'conty-trigger-')),
			'patch.json',
		);

		await writeFile(
			file,
			JSON.stringify({ data: { campaign: { name: 'Do arquivo' } } }),
		);
		await h.cli(
			[
				'trigger',
				'mission.video_submitted',
				'--url',
				target.url,
				'--data',
				`@${file}`,
				'--set',
				'data.mission.id=abc',
				'--set',
				'data.submission.resubmission=true',
				'--set',
				'data.extra.deep=1',
			],
			{ env },
		);

		const event = JSON.parse(target.deliveries[0]?.body ?? '');

		expect(event.data.mission.id).toBe('abc');
		expect(event.data.submission).toMatchObject({
			resubmission: true,
			format: 'video',
		});
		expect(event.data.campaign.name).toBe('Do arquivo');
		expect(event.data.campaign.url).toContain('https://');
		expect(event.data.extra).toEqual({ deep: 1 });
	});

	test('does not let --set or --data reach the prototype', async () => {
		const h = await setup();
		const target = app();

		expect(
			(
				await h.cli(
					[
						'trigger',
						'webhook.test',
						'--url',
						target.url,
						'--set',
						'__proto__.polluted=1',
					],
					{ env },
				)
			).code,
		).toBe(2);

		await h.cli(
			[
				'trigger',
				'webhook.test',
				'--url',
				target.url,
				'--data',
				'{"__proto__":{"polluted":1}}',
			],
			{ env },
		);

		expect(({} as { polluted?: number }).polluted).toBeUndefined();
		expect(
			JSON.parse(target.deliveries[0]?.body ?? '').polluted,
		).toBeUndefined();
	});

	test('exits 1 when the app answers an error, and when nobody is listening', async () => {
		const h = await setup();
		const result = await h.cli(
			['trigger', 'webhook.test', '--url', app(500).url, '--json'],
			{ env },
		);

		expect(result.code).toBe(1);
		expect(JSON.parse(result.out)).toMatchObject({
			status: 500,
			body: 'falhou',
		});

		const offline = await h.cli(
			['trigger', 'webhook.test', '--url', 'http://127.0.0.1:1'],
			{ env },
		);

		expect(offline.code).toBe(1);
		expect(offline.err).toContain('conty listen');
	});

	test('checks the event and the URL before sending', async () => {
		const h = await setup();

		expect((await h.cli(['trigger'])).code).toBe(2);
		expect((await h.cli(['trigger', 'nope'])).err).toContain(
			'application.approved',
		);
		expect(
			(await h.cli(['trigger', 'webhook.test', '--url', 'http://'])).code,
		).toBe(2);
		expect(
			(await h.cli(['trigger', 'webhook.test', '--set', 'semigual']))
				.code,
		).toBe(2);
	});

	test('uses one local secret, generated once and saved', async () => {
		const h = await setup();
		const target = app();

		await h.cli(['trigger', 'webhook.test', '--url', target.url]);
		await h.cli(['trigger', 'webhook.test', '--url', target.url]);

		const saved = (await h.config()).webhookSecret as string;

		expect(saved).toMatch(/^whsec_[0-9a-f]{48}$/);

		for (const delivery of target.deliveries)
			expect(await signed(delivery, saved)).toBe(true);
	});
});

describe('webhooks verify', () => {
	const body = JSON.stringify({ id: 'e1', type: 'webhook.test' });

	test('tells a valid signature from an invalid one', async () => {
		const h = await setup();
		const signature = await sign({ body, secret });
		const run = (...args: string[]) =>
			h.cli(['webhooks', 'verify', ...args], { stdin: body });

		expect(
			(await run('--signature', signature, '--secret', secret)).out,
		).toContain('"valid":true');
		expect(
			(await run('--signature', signature, '--secret', 'whsec_other'))
				.code,
		).toBe(1);
		expect(
			(
				await run(
					'--signature',
					signature,
					'--secret',
					`whsec_old,${secret}`,
				)
			).code,
		).toBe(0);

		const file = join(
			await mkdtemp(join(tmpdir(), 'conty-verify-')),
			'payload.json',
		);

		await writeFile(file, body);

		expect(
			(
				await h.cli([
					'webhooks',
					'verify',
					file,
					'--signature',
					signature,
					'--secret',
					secret,
				])
			).code,
		).toBe(0);
	});

	test('needs a signature and a secret', async () => {
		const h = await setup();

		expect(
			(
				await h.cli(['webhooks', 'verify', '--secret', secret], {
					stdin: body,
				})
			).code,
		).toBe(2);
		expect(
			(
				await h.cli(
					['webhooks', 'verify', '--signature', 't=1,v1=00'],
					{ stdin: body },
				)
			).code,
		).toBe(2);
	});
});

describe('listen', () => {
	const ready = /Ouvindo em (http:\/\/127\.0\.0\.1:\d+)/;
	const listen = (h: Awaited<ReturnType<typeof setup>>, ...args: string[]) =>
		start(h, ['listen', '--port', '0', ...args], ready, { env });

	test('forwards the delivery untouched and answers with what the app answered', async () => {
		const h = await setup();
		const target = app();
		const listening = await listen(h, '--forward-to', target.url);
		const url = listening.match[1] ?? '';
		const trigger = await h.cli(
			['trigger', 'application.approved', '--url', url],
			{ env },
		);

		expect(trigger.code).toBe(0);
		expect(JSON.parse(trigger.out)).toMatchObject({
			status: 200,
			body: 'ok',
		});

		const [forwarded] = target.deliveries;

		expect(forwarded?.headers.get('x-conty-event')).toBe(
			'application.approved',
		);
		expect(await signed(forwarded)).toBe(true);
		expect(await listening.stop()).toBe(0);
		expect(JSON.parse(listening.state.out.trim())).toMatchObject({
			type: 'application.approved',
			event: {
				type: 'application.approved',
				data: { creator: { name: 'Fulana Souza' } },
			},
			valid: true,
			status: 200,
			forward: target.url,
		});
	});

	test('passes the app failure back, so trigger exits 1', async () => {
		const h = await setup();
		const listening = await listen(h, '--forward-to', app(500).url);
		const trigger = await h.cli(
			['trigger', 'webhook.test', '--url', listening.match[1] ?? ''],
			{ env },
		);

		expect(trigger.code).toBe(1);

		await listening.stop();

		expect(JSON.parse(listening.state.out.trim())).toMatchObject({
			status: 500,
		});
	});

	test('answers 502 when the app is down', async () => {
		const h = await setup();
		const listening = await listen(h, '--forward-to', 'localhost:1/hook');
		const trigger = await h.cli(
			[
				'trigger',
				'webhook.test',
				'--url',
				listening.match[1] ?? '',
				'--json',
			],
			{ env },
		);

		expect(JSON.parse(trigger.out).status).toBe(502);

		await listening.stop();
	});

	test('answers 200 without --forward-to, 400 to a bad signature and 405 to a GET', async () => {
		const h = await setup();
		const listening = await listen(h);
		const url = listening.match[1] ?? '';

		expect(
			(await h.cli(['trigger', 'webhook.test', '--url', url], { env }))
				.code,
		).toBe(0);

		const body = JSON.stringify({ id: 'e1', type: 'webhook.test' });
		const bad = await fetch(url, {
			method: 'POST',
			body,
			headers: {
				'x-conty-signature': await sign({
					body,
					secret: 'whsec_wrong',
				}),
			},
		});
		const missing = await fetch(url, { method: 'POST', body });
		const wrongMethod = await fetch(url);

		expect([bad.status, missing.status, wrongMethod.status]).toEqual([
			400, 400, 405,
		]);

		await listening.stop();

		expect(listening.state.out).toContain('"valid":false');
	});

	test('says so when the port is already in use', async () => {
		const h = await setup();
		const first = await listen(h);
		const port = new URL(first.match[1] ?? '').port;
		const second = await h.cli(['listen', '--port', port], { env });

		expect(second.code).toBe(1);
		expect(second.err).toContain(`porta ${port}`);

		await first.stop();
	});

	test('checks its flags', async () => {
		const h = await setup();

		expect((await h.cli(['listen', '--port', '99999'])).code).toBe(2);
		expect((await h.cli(['listen', '--forward-to', 'http://'])).code).toBe(
			2,
		);
	});
});
