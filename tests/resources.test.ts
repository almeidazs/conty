import { describe, expect, test } from 'bun:test';

import { Conty, ContyError } from '../src';
import { json } from './rest/helpers';

const id = '4f2c7a1e-9b3d-4c8a-a1f0-6d2e8b7c5a10';

const setup = () => {
	const calls: { method: string; url: URL; body: unknown }[] = [];
	const client = new Conty({
		secret: 'ck_live_x',
		rest: {
			fetch: async (url, init) => {
				calls.push({
					method: String(init?.method),
					url: new URL(url),
					body: init?.body ? JSON.parse(String(init.body)) : void 0,
				});

				return json({ ok: true });
			},
		},
	});

	return { client, calls };
};

describe('resources', () => {
	test('me', async () => {
		const { client, calls } = setup();

		await client.me();

		expect(calls[0]?.method).toBe('GET');
		expect(calls[0]?.url.pathname).toBe('/public/v1/me');
	});

	test('coupons', async () => {
		const { client, calls } = setup();
		const body = { code: 'FULANA10', mission_id: id };

		await client.coupons.create(body);
		await client.coupons.list({ assigned: false, limit: 100 });
		await client.coupons.get(id);
		await client.coupons.update(id, { status: 'canceled' });
		await client.coupons.assign(id, { mission_id: id });
		await client.coupons.unassign(id);
		await client.coupons.listSales(id, { cursor: 'abc' });
		await client.coupons.upsertSale(id, 'pedido 10/293', {
			amount_cents: 15000,
			status: 'confirmed',
			occurred_at: '2026-10-21T15:42:00Z',
		});

		const seen = calls.map(
			(call) => `${call.method} ${call.url.pathname}${call.url.search}`,
		);

		expect(seen).toEqual([
			'POST /public/v1/coupons',
			'GET /public/v1/coupons?assigned=false&limit=100',
			`GET /public/v1/coupons/${id}`,
			`PATCH /public/v1/coupons/${id}`,
			`POST /public/v1/coupons/${id}/assign`,
			`POST /public/v1/coupons/${id}/unassign`,
			`GET /public/v1/coupons/${id}/sales?cursor=abc`,
			`PUT /public/v1/coupons/${id}/sales/pedido%2010%2F293`,
		]);
		expect(calls[0]?.body).toEqual(body);
		expect(calls[3]?.body).toEqual({ status: 'canceled' });
		expect(calls[7]?.body).toMatchObject({ amount_cents: 15000 });
	});

	test('campaigns and missions', async () => {
		const { client, calls } = setup();

		await client.campaigns.list({ status: 'approved,paused', q: 'verão' });
		await client.campaigns.get(id);
		await client.campaigns.stages(id, { q: 'ana' });
		await client.campaigns.items(id, {
			stage: 'script.brand',
			sort: 'views',
			followers_min: 1000,
			only_compatible: true,
		});
		await client.missions.get(id);

		const seen = calls.map(
			(call) => `${call.method} ${call.url.pathname}${call.url.search}`,
		);

		expect(seen).toEqual([
			'GET /public/v1/campaigns?status=approved%2Cpaused&q=ver%C3%A3o',
			`GET /public/v1/campaigns/${id}`,
			`GET /public/v1/campaigns/${id}/stages?q=ana`,
			`GET /public/v1/campaigns/${id}/items?stage=script.brand&sort=views&followers_min=1000&only_compatible=true`,
			`GET /public/v1/missions/${id}`,
		]);
	});

	test('request options reach the rest client', async () => {
		const { client, calls } = setup();

		await client.coupons.get(id, { headers: { 'x-trace': '1' } });

		expect(calls).toHaveLength(1);
	});
});

describe('pagination', () => {
	const paged = (pages: { data: number[]; next?: string }[]) => {
		const urls: URL[] = [];
		const client = new Conty({
			secret: 'ck_live_x',
			rest: {
				fetch: async (url) => {
					const parsed = new URL(url);
					const index = Number(
						parsed.searchParams.get('cursor') ?? 0,
					);
					const page = pages[index];

					urls.push(parsed);

					return json({
						data: page?.data,
						has_more: Boolean(page?.next),
						next_cursor: page?.next ?? null,
					});
				},
			},
		});

		return { client, urls };
	};

	const three = [
		{ data: [1, 2], next: '1' },
		{ data: [3], next: '2' },
		{ data: [4] },
	];

	test('iterate walks every page and keeps the query', async () => {
		const { client, urls } = paged(three);
		const seen: unknown[] = [];

		for await (const coupon of client.coupons.iterate({ limit: 2 }))
			seen.push(coupon);

		expect(seen).toEqual([1, 2, 3, 4]);
		expect(urls.map((url) => url.search)).toEqual([
			'?limit=2',
			'?limit=2&cursor=1',
			'?limit=2&cursor=2',
		]);
	});

	test('pages yields whole pages and starts at a given cursor', async () => {
		const { client, urls } = paged(three);
		const seen: unknown[] = [];

		for await (const page of client.coupons.pages({ cursor: '1' }))
			seen.push(page.data);

		expect(seen).toEqual([[3], [4]]);
		expect(urls).toHaveLength(2);
	});

	test('break stops fetching', async () => {
		const { client, urls } = paged(three);

		for await (const _ of client.campaigns.iterate()) break;

		expect(urls).toHaveLength(1);
	});

	test('sales and board items use their own route', async () => {
		const { client, urls } = paged(three);

		await Array.fromAsync(client.coupons.iterateSales(id));
		await Array.fromAsync(
			client.campaigns.iterateItems(id, { stage: 'script.brand' }),
		);

		expect(urls[0]?.pathname).toBe(`/public/v1/coupons/${id}/sales`);
		expect(urls[3]?.pathname).toBe(`/public/v1/campaigns/${id}/items`);
		expect(urls[3]?.searchParams.get('stage')).toBe('script.brand');
	});

	test('a failed page throws a ContyError', async () => {
		const client = new Conty({
			secret: 'ck_live_x',
			rest: {
				retries: 0,
				fetch: async () =>
					json(
						{
							error: {
								code: 'rate_limited',
								message: 'x',
								request_id: 'r',
							},
						},
						{ status: 400 },
					),
			},
		});

		expect(
			Array.fromAsync(client.coupons.iterate()),
		).rejects.toBeInstanceOf(ContyError);
	});

	test('a cursor that does not move ends the walk', async () => {
		const { client, urls } = paged([{ data: [1], next: '0' }]);

		expect(
			await Array.fromAsync(client.coupons.iterate({ cursor: '0' })),
		).toEqual([1]);
		expect(urls).toHaveLength(1);
	});
});
