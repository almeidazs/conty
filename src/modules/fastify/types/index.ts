import type { WebhooksOptions } from '../../webhooks';

/** Options of the Fastify `Webhooks` plugin. */
export interface FastifyWebhooksOptions extends WebhooksOptions {
	/** Route that receives the deliveries. @default '/' */
	path?: string;
}
