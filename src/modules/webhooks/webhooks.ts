import type { WebhookEvent } from '../types';
import type { SignOptions, VerifyOptions } from './types';

const encoder = new TextEncoder();

/** Max difference between the signature time and now, in seconds. */
const TOLERANCE = 5 * 60;

const text = (body: string | Uint8Array) =>
	typeof body === 'string' ? body : new TextDecoder().decode(body);

const importKey = (secret: string) =>
	crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify'],
	);

/** Builds an `X-Conty-Signature` (`t=<unix>,v1=<hex>`) the way Conty does. Useful to test your endpoint. */
export const sign = async ({
	body,
	secret,
	timestamp = Math.floor(Date.now() / 1000),
}: SignOptions): Promise<string> => {
	const mac = await crypto.subtle.sign(
		'HMAC',
		await importKey(secret),
		encoder.encode(`${timestamp}.${text(body)}`),
	);
	const hex = [...new Uint8Array(mac)]
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');

	return `t=${timestamp},v1=${hex}`;
};

/**
 * Checks that a delivery came from Conty and wasn't changed: the HMAC-SHA256
 * of `"<t>.<raw body>"` must match `v1` (compared in constant time) and `t` must
 * be within 5 minutes.
 */
export const verify = async ({
	body,
	header,
	secret,
}: VerifyOptions): Promise<boolean> => {
	const timestamp = /\bt=(\d+)/.exec(header ?? '')?.[1];
	const hex = /\bv1=([^,\s]+)/.exec(header ?? '')?.[1];

	if (!timestamp || !hex) return false;

	if (Math.abs(Date.now() / 1000 - Number(timestamp)) > TOLERANCE)
		return false;

	const bytes = Uint8Array.from(hex.match(/../g) ?? [], (byte) =>
		Number.parseInt(byte, 16),
	);
	const payload = encoder.encode(`${timestamp}.${text(body)}`);

	for (const candidate of [secret].flat()) {
		const key = await importKey(candidate);

		if (await crypto.subtle.verify('HMAC', key, bytes, payload))
			return true;
	}

	return false;
};

/** Verifies the signature and parses the body into a typed event, or `null` if it isn't valid. */
export const construct = async (
	options: VerifyOptions,
): Promise<WebhookEvent | null> => {
	if (!(await verify(options))) return null;

	try {
		return JSON.parse(text(options.body));
	} catch {
		return null;
	}
};
