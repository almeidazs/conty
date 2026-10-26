import { describe, expect, test } from 'bun:test';
import { createHmac } from 'node:crypto';

import { construct, sign, verify } from '../../src/modules/webhooks';

const secret = 'whsec_test';
const event = { id: '1', type: 'mission.approved', data: {} };
const body = JSON.stringify(event);
const now = () => Math.floor(Date.now() / 1000);

// Independent of the implementation: what the docs describe, with node:crypto.
const reference = (t: number, raw: string, key = secret) =>
	`t=${t},v1=${createHmac('sha256', key).update(`${t}.${raw}`).digest('hex')}`;

describe('sign', () => {
	test('matches the documented algorithm', async () => {
		const t = now();

		expect(await sign({ body, secret, timestamp: t })).toBe(
			reference(t, body),
		);
		expect(
			await sign({
				body: new TextEncoder().encode(body),
				secret,
				timestamp: t,
			}),
		).toBe(reference(t, body));
	});
});

describe('verify', () => {
	test('accepts a signature made the documented way', async () => {
		const signature = reference(now(), body);

		expect(await verify({ body, header: signature, secret })).toBe(true);
		expect(
			await verify({
				body: new TextEncoder().encode(body),
				header: signature,
				secret,
			}),
		).toBe(true);
	});

	test('rejects a changed body and the wrong secret', async () => {
		const signature = reference(now(), body);

		expect(
			await verify({ body: `${body} `, header: signature, secret }),
		).toBe(false);
		expect(
			await verify({ body, header: signature, secret: 'whsec_other' }),
		).toBe(false);
	});

	test('accepts either secret while rotating', async () => {
		const signature = reference(now(), body, 'whsec_old');

		expect(
			await verify({
				body,
				header: signature,
				secret: [secret, 'whsec_old'],
			}),
		).toBe(true);
	});

	test('rejects stale and future signatures', async () => {
		expect(
			await verify({
				body,
				header: reference(now() - 6 * 60, body),
				secret,
			}),
		).toBe(false);
		expect(
			await verify({
				body,
				header: reference(now() + 6 * 60, body),
				secret,
			}),
		).toBe(false);
	});

	test('rejects missing, malformed and non hex signatures', async () => {
		for (const bad of [
			undefined,
			null,
			'',
			'garbage',
			'v1=00',
			`t=${now()}`,
			`t=${now()},v1=zz`,
		]) {
			expect(await verify({ body, header: bad, secret })).toBe(false);
		}
	});
});

describe('construct', () => {
	test('returns the typed event', async () => {
		expect(
			await construct({ body, header: reference(now(), body), secret }),
		).toEqual(event as never);
	});

	test('returns null for a bad signature or a body that is not JSON', async () => {
		expect(await construct({ body, header: undefined, secret })).toBeNull();
		expect(
			await construct({
				body: 'nope',
				header: reference(now(), 'nope'),
				secret,
			}),
		).toBeNull();
	});
});
