import type { WebhooksOptions } from '../../webhooks';

/** What the handler accepts: a `Request`, or the `{ request }` object most frameworks pass. */
export type WebhookInput = Request | { request: Request };

/** The options, or a function that builds them from the runtime bindings (`env` on Cloudflare Workers). */
export type WebhooksSource<Env> =
	| WebhooksOptions
	| ((env: Env) => WebhooksOptions);
