import { describe, expect, test } from 'bun:test';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { json, setup } from './helpers';

const ready = async () => {
	const h = await setup();

	await h.login();

	return h;
};

describe('api', () => {
	test('sends the method, route, query and headers', async () => {
		const h = await ready();

		h.state.answer = () => json({ data: [] });

		const result = await h.cli([
			'api',
			'get',
			'/coupons',
			'-q',
			'limit=5',
			'-q',
			'status=a',
			'-q',
			'status=b',
			'-H',
			'x-trace: 1',
		]);

		expect(result.code).toBe(0);
		expect(JSON.parse(result.out)).toEqual({ data: [] });
		expect(h.calls[0]?.method).toBe('GET');
		expect(h.calls[0]?.path).toBe('/coupons');
		expect(h.calls[0]?.params.get('limit')).toBe('5');
		expect(h.calls[0]?.params.getAll('status')).toEqual(['a', 'b']);
		expect(h.calls[0]?.headers.get('x-trace')).toBe('1');
		expect(h.calls[0]?.headers.get('authorization')).toContain('ck_live_');
	});

	test('takes the body inline, from a file or from stdin', async () => {
		const h = await ready();
		const file = join(
			await mkdtemp(join(tmpdir(), 'conty-api-')),
			'body.json',
		);

		await writeFile(file, '{"from":"file"}');
		await h.cli(['api', 'POST', '/coupons', '-d', '{"code":"A"}']);
		await h.cli(['api', 'POST', '/coupons', '-d', '-'], {
			stdin: '{"from":"stdin"}',
		});
		await h.cli(['api', 'PATCH', '/coupons/x', '-d', `@${file}`]);

		expect(h.calls.map((call) => [call.method, call.body])).toEqual([
			['POST', { code: 'A' }],
			['POST', { from: 'stdin' }],
			['PATCH', { from: 'file' }],
		]);
	});

	test('accepts a full URL of the API in use, and only that', async () => {
		const h = await ready();
		const base = h.env.CONTY_BASE_URL;

		expect((await h.cli(['api', 'GET', `${base}/me?a=1`])).code).toBe(0);
		expect(h.calls[0]?.path).toBe('/me');
		expect(h.calls[0]?.params.get('a')).toBe('1');
		expect(
			(
				await h.cli([
					'api',
					'GET',
					'https://evil.example.com/public/v1/me',
				])
			).code,
		).toBe(2);
		expect((await h.cli(['api', 'GET', `${base}.evil.com/x`])).code).toBe(
			2,
		);
		expect(h.calls).toHaveLength(1);
	});

	test('a non 2xx answer exits 1, with the body on stdout and the summary on stderr', async () => {
		const h = await ready();
		const body = {
			error: {
				code: 'not_found',
				message: 'Nada aqui.',
				request_id: 'r1',
			},
		};

		h.state.answer = () => json(body, 404);

		const result = await h.cli(['api', 'GET', '/coupons/x']);

		expect(result.code).toBe(1);
		expect(JSON.parse(result.out)).toEqual(body);
		expect(result.err).toContain('not_found');
	});

	test('--include shows the status and the headers', async () => {
		const h = await ready();

		h.state.answer = () => json({ ok: 1 }, 200, { 'x-request-id': 'abc' });

		const result = await h.cli(['api', 'GET', '/me', '--include']);

		expect(result.out).toContain('HTTP 200');
		expect(result.out).toContain('x-request-id: abc');
	});

	test('rejects a bad method, query or header', async () => {
		const h = await ready();

		expect((await h.cli(['api', 'FETCH', '/me'])).code).toBe(2);
		expect(
			(await h.cli(['api', 'GET', '/me', '-q', 'semigual'])).code,
		).toBe(2);
		expect(
			(await h.cli(['api', 'GET', '/me', '-H', 'semdoispontos'])).code,
		).toBe(2);
		expect((await h.cli(['api', 'GET'])).code).toBe(2);
		expect(h.calls).toHaveLength(0);
	});
});
