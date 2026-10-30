import type { FastifyPluginAsync } from 'fastify';

import { handle } from '../webhooks/handle';
import type { FastifyWebhooksOptions } from './types';

export type { WebhooksOptions } from '../webhooks';
export type * from './types';

/**
 * `app.register(Webhooks, { path: '/webhooks/conty', secret, ... })`. It keeps
 * its own raw-body parser, so it doesn't change how the rest of the app parses JSON.
 */
export const Webhooks: FastifyPluginAsync<FastifyWebhooksOptions> = async (
	app,
	{ path = '/', ...options },
) => {
	app.addContentTypeParser(
		'application/json',
		{ parseAs: 'buffer' },
		(_request, body, done) => done(null, body),
	);

	app.post(path, async (request, reply) => {
		const header = request.headers['x-conty-signature'];

		return reply
			.code(
				await handle(options, {
					body: request.body as Buffer,
					header: Array.isArray(header) ? header[0] : header,
				}),
			)
			.send();
	});
};
