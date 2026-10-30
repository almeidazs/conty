import { handle } from '../webhooks/handle';
import type { WebhookInput, WebhooksSource } from './types';

export type { WebhooksOptions } from '../webhooks';
export type * from './types';

/**
 * Webhook handler for any runtime with the Web `Request`/`Response`: Bun, Deno, Next
 * route handlers, SvelteKit, Astro, Remix... It verifies, parses and runs the handlers.
 *
 * On Cloudflare Workers the secret lives in `env`, so pass a function:
 * `export default { fetch: Webhooks((env) => ({ secret: env.CONTY_WEBHOOK_SECRET })) }`.
 */
export const Webhooks =
	<Env = undefined>(source: WebhooksSource<Env>) =>
	async (input: WebhookInput, env?: Env): Promise<Response> => {
		const request = 'request' in input ? input.request : input;

		return new Response(null, {
			status: await handle(
				typeof source === 'function' ? source(env as Env) : source,
				{
					body: await request.text(),
					header: request.headers.get('x-conty-signature'),
				},
			),
		});
	};
