import { describe, expect, test } from 'bun:test';

import {
	Conty,
	ContyError,
	isContyError,
	isCouponExists,
	isNotFound,
	isRateLimited,
	isValidationFailed,
} from '../src';
import { REST, unwrap } from '../src/modules/rest';
import { createRest, headersOf, json } from './rest/helpers';

describe('Conty', () => {
	test('accepts the secret as a string', async () => {
		const client = new Conty('s3');

		expect(client.rest).toBeInstanceOf(REST);
	});

	test('passes the secret and rest options to the REST client', async () => {
		const calls: Request[] = [];
		const client = new Conty({
			secret: 's3',
			rest: {
				baseUrl: 'https://example.test',
				fetch: async (url, init) => {
					calls.push(new Request(url, init));

					return json({ ok: true });
				},
			},
		});
		const result = await client.rest.get('/ping');

		expect(result.ok).toBe(true);
		expect(calls[0]?.url).toBe('https://example.test/ping');
		expect(calls[0]?.headers.get('authorization')).toBe('Bearer s3');
	});

	test('secret wins over rest.secret', async () => {
		const { rest, calls } = createRest(() => json({}));
		const client = new Conty({ secret: 'top', rest });

		await client.rest.get('/x');

		expect(client.rest).toBe(rest);
		expect(headersOf(calls[0]).get('authorization')).toBe('Bearer top');
	});

	test('reuses a REST instance untouched without a secret', async () => {
		const { rest, calls } = createRest(() => json({}), { secret: 'own' });
		const client = new Conty({ rest });

		await client.rest.get('/x');

		expect(client.rest).toBe(rest);
		expect(headersOf(calls[0]).get('authorization')).toBe('Bearer own');
	});

	test('works without options', () => {
		expect(new Conty().rest).toBeInstanceOf(REST);
	});
});

describe('unwrap', () => {
	const envelope = {
		error: {
			code: 'not_found',
			message: 'Cupom nao encontrado',
			details: [{ path: 'coupon_id', message: 'unknown' }],
			request_id: 'req_1',
		},
	};
	const client = new Conty({
		secret: 's3',
		rest: {
			fetch: async (url) =>
				String(url).endsWith('/me')
					? json({ enterprise: { name: 'Acme' } })
					: json(envelope, { status: 404 }),
		},
	});

	test('the method still resolves with the result, even on failure', async () => {
		const result = await client.coupons.get('x');

		expect(result.ok).toBe(false);
		expect(result.ok ? void 0 : result.error.code).toBe('not_found');
	});

	test('resolves with the data of a successful call', async () => {
		expect(await client.me().unwrap()).toEqual({
			enterprise: { name: 'Acme' },
		});
	});

	test('rejects with a ContyError that carries the envelope', async () => {
		const error = await client.coupons
			.get('x')
			.unwrap()
			.catch((cause: unknown) => cause);

		expect(error).toBeInstanceOf(ContyError);
		expect(error).toBeInstanceOf(Error);
		expect(error).toMatchObject({
			name: 'ContyError',
			type: 'http',
			status: 404,
			code: 'not_found',
			requestId: 'req_1',
			message: 'Cupom nao encontrado',
			details: [{ path: 'coupon_id', message: 'unknown' }],
		});
	});

	test('exists on every resource', async () => {
		await expect(client.campaigns.list().unwrap()).rejects.toBeInstanceOf(
			ContyError,
		);
		await expect(client.missions.get('x').unwrap()).rejects.toBeInstanceOf(
			ContyError,
		);
	});

	test('keeps the cause of a network failure', async () => {
		const cause = new Error('offline');
		const offline = new Conty({
			rest: {
				retries: 0,
				fetch: async () => {
					throw cause;
				},
			},
		});
		const error = await offline
			.me()
			.unwrap()
			.catch((value: unknown) => value);

		expect(error).toMatchObject({ type: 'network', status: void 0 });
		expect((error as ContyError).cause).toBe(cause);
	});

	test('rest results can be unwrapped with the helper', async () => {
		expect(await unwrap(await client.rest.get('/me'))).toEqual({
			enterprise: { name: 'Acme' },
		});
		expect(() =>
			unwrap({ ok: false, error: { type: 'network', message: 'x' } }),
		).toThrow(ContyError);
	});
});

describe('error guards', () => {
	const envelope = (code: string, details?: unknown[]) =>
		json(
			{ error: { code, message: code, details, request_id: 'req_1' } },
			{ status: 409 },
		);
	const clientFor = (code: string, details?: unknown[]) =>
		new Conty({
			rest: { retries: 0, fetch: async () => envelope(code, details) },
		});

	test('match a failed result by code', async () => {
		const result = await clientFor('coupon_exists', [
			{ coupon_id: 'c1' },
		]).coupons.get('x');

		expect(isContyError(result)).toBe(true);
		expect(isContyError(result, 'coupon_exists')).toBe(true);
		expect(isContyError(result, 'not_found')).toBe(false);
		expect(isCouponExists(result)).toBe(true);
		expect(isNotFound(result)).toBe(false);
	});

	test('match an error caught from unwrap', async () => {
		const error = await clientFor('rate_limited')
			.me()
			.unwrap()
			.catch((cause: unknown) => cause);

		expect(isContyError(error)).toBe(true);
		expect(isRateLimited(error)).toBe(true);
		expect(isValidationFailed(error)).toBe(false);
	});

	test('narrow details', async () => {
		const result = await clientFor('coupon_exists', [
			{ coupon_id: 'c1' },
		]).coupons.get('x');

		expect(
			isCouponExists(result) ? result.error.details[0]?.coupon_id : null,
		).toBe('c1');
	});

	test('a success, a network failure and other values are never one', async () => {
		const ok = await new Conty({
			rest: { fetch: async () => json({}) },
		}).me();
		const offline = await new Conty({
			rest: {
				retries: 0,
				fetch: async () => {
					throw new Error('offline');
				},
			},
		}).me();

		for (const value of [ok, offline, new Error('x'), null, void 0, 'x']) {
			expect(isContyError(value)).toBe(false);
			expect(isRateLimited(value)).toBe(false);
		}
	});
});
