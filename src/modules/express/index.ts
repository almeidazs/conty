import type { WebhooksOptions } from '../webhooks';
import { handle } from '../webhooks/handle';
import type { ExpressRequest, ExpressResponse } from './types';

export type { WebhooksOptions } from '../webhooks';
export type * from './types';

/**
 * `app.post('/webhooks/conty', express.raw({ type: 'application/json' }), Webhooks({ ... }))`.
 * The body must reach the handler raw: a parsed one can't be verified.
 */
export const Webhooks =
	(options: WebhooksOptions) =>
	async ({ body, headers }: ExpressRequest, res: ExpressResponse) => {
		if (typeof body !== 'string' && !(body instanceof Uint8Array)) {
			res.statusCode = 500;

			return res.end(
				"Webhook body must be raw: use express.raw({ type: 'application/json' }) on this route.",
			);
		}

		const header = headers['x-conty-signature'];

		res.statusCode = await handle(options, {
			body,
			header: Array.isArray(header) ? header[0] : header,
		});

		res.end();
	};
