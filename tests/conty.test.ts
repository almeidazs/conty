import { describe, expect, test } from 'bun:test';

import { Conty } from '../src';
import { REST } from '../src/modules/rest';
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
