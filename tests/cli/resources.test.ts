import { describe, expect, test } from 'bun:test';

import { formatObject, formatTable } from '../../src/cli/shared/output';
import { json, page, setup } from './helpers';

const id = '4f2c7a1e-9b3d-4c8a-a1f0-6d2e8b7c5a10';

const ready = async () => {
	const h = await setup();

	await h.login();

	return h;
};

const seen = (
	calls: { method: string; path: string; params: URLSearchParams }[],
) =>
	calls.map(({ method, path, params }) => {
		const query = new URLSearchParams([...params].sort());

		return `${method} ${path}${params.size ? `?${query}` : ''}`;
	});

describe('coupons', () => {
	test('list sends the flags as the query and prints JSON when piped', async () => {
		const h = await ready();

		h.state.answer = () => page([{ code: 'FULANA10' }], 'next-1');

		const result = await h.cli([
			'coupons',
			'list',
			'--no-assigned',
			'--limit',
			'10',
			'--campaign-id',
			id,
			'--status',
			'active',
		]);

		expect(seen(h.calls)).toEqual([
			`GET /coupons?assigned=false&campaign_id=${id}&limit=10&status=active`,
		]);
		expect(JSON.parse(result.out)).toMatchObject({
			has_more: true,
			next_cursor: 'next-1',
		});

		h.calls.length = 0;

		await h.cli(['coupons', 'list', '--assigned', '--cursor', 'abc']);

		expect(seen(h.calls)).toEqual([
			'GET /coupons?assigned=true&cursor=abc',
		]);
	});

	test('--all walks the pages as NDJSON', async () => {
		const h = await ready();

		h.state.answer = ({ params }) =>
			params.get('cursor') === 'p2'
				? page([{ id: 'c3' }])
				: page([{ id: 'c1' }, { id: 'c2' }], 'p2');

		const result = await h.cli(['coupons', 'list', '--all']);

		expect(
			result.out
				.trim()
				.split('\n')
				.map((line) => JSON.parse(line).id),
		).toEqual(['c1', 'c2', 'c3']);
		expect(seen(h.calls)).toEqual([
			'GET /coupons',
			'GET /coupons?cursor=p2',
		]);
	});

	test('a failed page ends the walk with the error', async () => {
		const h = await ready();

		h.state.answer = ({ params }) =>
			params.has('cursor')
				? json(
						{
							error: {
								code: 'rate_limited',
								message: 'Calma.',
								request_id: 'r9',
							},
						},
						400,
					)
				: page([{ id: 'c1' }], 'p2');

		const result = await h.cli(['coupons', 'list', '--all']);

		expect(result.code).toBe(1);
		expect(result.out.trim().split('\n')).toHaveLength(1);
		expect(JSON.parse(result.err).error).toMatchObject({
			code: 'rate_limited',
			requestId: 'r9',
		});
	});

	test('bad flags are usage errors that never reach the API', async () => {
		const h = await ready();

		expect((await h.cli(['coupons', 'list', '--limit', 'abc'])).code).toBe(
			2,
		);
		expect((await h.cli(['coupons', 'list', '--nope'])).code).toBe(2);
		expect((await h.cli(['coupons', 'get'])).code).toBe(2);
		expect((await h.cli(['coupons', 'get', 'a', 'b'])).code).toBe(2);
		expect(h.calls).toHaveLength(0);
	});

	test('create merges --data with the flags, which win', async () => {
		const h = await ready();
		const data = JSON.stringify({
			code: 'VELHO',
			mission_id: id,
			discount_description: 'x',
		});

		await h.cli(['coupons', 'create', '--code', 'NOVO10', '-d', data]);

		expect(h.calls[0]).toMatchObject({
			method: 'POST',
			body: { code: 'NOVO10', mission_id: id, discount_description: 'x' },
		});
	});

	test('create reads --data from stdin and validates the body', async () => {
		const h = await ready();

		expect(
			(
				await h.cli(['coupons', 'create', '--data', '-'], {
					stdin: JSON.stringify({ code: 'ABC', campaign_id: id }),
				})
			).code,
		).toBe(0);
		expect(h.calls[0]?.body).toEqual({ code: 'ABC', campaign_id: id });

		h.calls.length = 0;

		expect((await h.cli(['coupons', 'create', '--code', 'ABC'])).code).toBe(
			2,
		);
		expect(
			(await h.cli(['coupons', 'create', '--mission-id', id])).code,
		).toBe(2);
		expect(
			(
				await h.cli([
					'coupons',
					'create',
					'--code',
					'ABC',
					'--mission-id',
					id,
					'--campaign-id',
					id,
				])
			).code,
		).toBe(2);
		expect(
			(await h.cli(['coupons', 'create', '--data', '{bad'])).code,
		).toBe(2);
		expect((await h.cli(['coupons', 'create', '--data', '[1]'])).code).toBe(
			2,
		);
		expect(h.calls).toHaveLength(0);
	});

	test('get, update, assign, unassign, sales and upsert-sale hit their routes', async () => {
		const h = await ready();

		await h.cli(['coupons', 'get', id]);
		await h.cli(['coupons', 'update', id, '--status', 'canceled']);
		await h.cli(['coupons', 'assign', id, '--mission-id', 'm1']);
		await h.cli(['coupons', 'unassign', id]);
		await h.cli(['coupons', 'sales', id, '--cursor', 'abc']);
		await h.cli([
			'coupons',
			'upsert-sale',
			id,
			'pedido 10/293',
			'--amount-cents',
			'15000',
			'--status',
			'confirmed',
			'--occurred-at',
			'2026-10-21T15:42:00Z',
		]);

		expect(seen(h.calls)).toEqual([
			`GET /coupons/${id}`,
			`PATCH /coupons/${id}`,
			`POST /coupons/${id}/assign`,
			`POST /coupons/${id}/unassign`,
			`GET /coupons/${id}/sales?cursor=abc`,
			`PUT /coupons/${id}/sales/pedido%2010%2F293`,
		]);
		expect(h.calls[1]?.body).toEqual({ status: 'canceled' });
		expect(h.calls[2]?.body).toEqual({ mission_id: 'm1' });
		expect(h.calls[5]?.body).toEqual({
			amount_cents: 15000,
			status: 'confirmed',
			occurred_at: '2026-10-21T15:42:00Z',
		});
	});

	test('missing fields are usage errors', async () => {
		const h = await ready();

		expect((await h.cli(['coupons', 'update', id])).code).toBe(2);
		expect((await h.cli(['coupons', 'assign', id])).code).toBe(2);
		expect(
			(
				await h.cli([
					'coupons',
					'upsert-sale',
					id,
					'x',
					'--status',
					'confirmed',
				])
			).code,
		).toBe(2);
		expect(h.calls).toHaveLength(0);
	});

	test('an API error shows the code and request id, and exits 1', async () => {
		const h = await ready();

		h.state.answer = () =>
			json(
				{
					error: {
						code: 'not_found',
						message: 'Cupom não encontrado.',
						request_id: 'req_1',
					},
				},
				404,
			);

		const result = await h.cli(['coupons', 'get', id, '--json']);

		expect(result.code).toBe(1);
		expect(JSON.parse(result.err).error).toMatchObject({
			code: 'not_found',
			status: 404,
			requestId: 'req_1',
		});
	});
});

describe('campaigns and missions', () => {
	test('list, get, stages and missions get', async () => {
		const h = await ready();

		await h.cli([
			'campaigns',
			'list',
			'--status',
			'approved,paused',
			'--q',
			'verão',
		]);
		await h.cli(['campaigns', 'get', id]);
		await h.cli(['campaigns', 'stages', id, '--q', 'ana']);
		await h.cli(['missions', 'get', id]);

		expect(seen(h.calls)).toEqual([
			'GET /campaigns?q=ver%C3%A3o&status=approved%2Cpaused',
			`GET /campaigns/${id}`,
			`GET /campaigns/${id}/stages?q=ana`,
			`GET /missions/${id}`,
		]);
	});

	test('items needs a stage and takes the board filters', async () => {
		const h = await ready();

		expect((await h.cli(['campaigns', 'items', id])).code).toBe(2);

		await h.cli([
			'campaigns',
			'items',
			id,
			'--stage',
			'interested',
			'--only-compatible',
			'--followers-min',
			'10000',
			'--sort',
			'match',
		]);

		expect(seen(h.calls)).toEqual([
			`GET /campaigns/${id}/items?followers_min=10000&only_compatible=true&sort=match&stage=interested`,
		]);
	});

	test('items --all uses the board iterator', async () => {
		const h = await ready();

		h.state.answer = ({ params }) =>
			params.get('cursor') === 'p2'
				? page([{ id: 'b' }])
				: page([{ id: 'a' }], 'p2');

		const result = await h.cli([
			'campaigns',
			'items',
			id,
			'--stage',
			'submitted',
			'--all',
		]);

		expect(result.out.trim().split('\n')).toEqual([
			'{"id":"a"}',
			'{"id":"b"}',
		]);
	});
});

describe('text output', () => {
	test('a table aligns the columns and shows nested paths', () => {
		const rows = [
			{ id: '1', code: 'FULANA10', creator: { name: 'Fulana Souza' } },
			{ id: '22', code: 'X', creator: null },
		];

		expect(
			formatTable(rows, [
				['id', 'id'],
				['code', 'code'],
				['creator', 'creator.name'],
			]),
		).toBe(
			[
				'ID  CODE      CREATOR',
				'1   FULANA10  Fulana Souza',
				'22  X         -',
			].join('\n'),
		);
		expect(formatTable([], [['id', 'id']])).toBe('Nenhum resultado.');
	});

	test('an object is key: value lines, nested ones indented', () => {
		expect(
			formatObject({
				code: 'A',
				creator: { name: 'Ana' },
				tags: ['x', 'y'],
				none: null,
			}),
		).toBe(
			[
				'code: A',
				'creator:',
				'  name: Ana',
				'tags:',
				'  - x',
				'  - y',
				'none: -',
			].join('\n'),
		);
	});
});

describe('help and parity with the SDK', () => {
	test('--help lists the commands, and every SDK method has a command', async () => {
		const h = await setup();
		const help = async (...args: string[]) =>
			(await h.cli([...args, '--help'])).out;
		const sdk = {
			coupons: [
				'create',
				'list',
				'get',
				'update',
				'assign',
				'unassign',
				'sales',
				'upsert-sale',
			],
			campaigns: ['list', 'get', 'stages', 'items'],
			missions: ['get'],
		};

		for (const [group, commands] of Object.entries(sdk)) {
			const text = await help(group);

			for (const command of commands)
				expect(text).toContain(`  ${command}`);
		}

		expect(await help()).toContain('login');
		expect((await h.cli(['--version'])).out).toMatch(/^\d+\.\d+\.\d+/);
		expect((await h.cli(['nope'])).code).toBe(2);
	});
});
