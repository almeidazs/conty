import type { Column } from './options';

export const DEFAULT_PORT = 4242;

export const DEFAULT_TRIGGER_URL = `http://127.0.0.1:${DEFAULT_PORT}`;

/** Largest delivery `listen` accepts, in bytes. */
export const MAX_BODY = 1024 * 1024;

/** Milliseconds `listen` and `trigger` wait for an answer. */
export const REQUEST_TIMEOUT = 10_000;

/** Headers of a delivery that `listen` hands to your app exactly as they arrived. */
export const FORWARDED_HEADERS = [
	'content-type',
	'user-agent',
	'x-conty-event',
	'x-conty-event-id',
	'x-conty-delivery',
	'x-conty-signature',
];

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

/** `--data` of the commands that write a body. */
export const DATA_FLAG = '-d, --data <json|@arquivo|->';

export const DATA_HELP =
	'corpo em JSON: inline, @arquivo ou - (stdin); as flags vencem';

/** `--secret` of the webhook commands. */
export const SECRET_FLAG = [
	'--secret <whsec>',
	'segredo que assina e verifica (padrão: o do perfil, ou um gerado)',
] as const;

export const PROFILE_NAME = /^[A-Za-z0-9._-]{1,40}$/;

export const MAX_CELL = 48;

/** Keys that `trigger --set` and `--data` must never reach. */
export const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const COUPON_COLUMNS: Column[] = [
	['id', 'id'],
	['code', 'code'],
	['status', 'status'],
	['creator', 'creator.name'],
	['sales', 'totals.sales_count'],
];

export const SALE_COLUMNS: Column[] = [
	['external_id', 'external_id'],
	['amount_cents', 'amount_cents'],
	['status', 'status'],
	['commission_cents', 'commission_cents'],
	['occurred_at', 'occurred_at'],
];

export const CAMPAIGN_COLUMNS: Column[] = [
	['id', 'id'],
	['kind', 'kind'],
	['name', 'name'],
	['status', 'status'],
];

export const ITEM_COLUMNS: Column[] = [
	['kind', 'kind'],
	['id', 'id'],
	['creator', 'creator.name'],
	['status', 'status_label'],
];
