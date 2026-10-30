import { Webhooks } from 'contyos/fetch';
import type { WebhooksOptions } from 'contyos/webhooks';

export const handler = Webhooks({
	secret: 'whsec_x',
	// `data` is narrowed by the handler name.
	onApplicationApproved: ({ data }) => data.mission.id,
	onMissionVideoSubmitted: async ({ type }) => type,
	onEvent: (event) => event.type,
	onError: (error, event) => [error, event.id],
});

export const unknown: WebhooksOptions = {
	secret: 'x',
	// @ts-expect-error there is no such event
	onMissionTeleported() {},
};

// Cloudflare Workers: the options come from `env`, which is inferred from the parameter.
export const worker = {
	fetch: Webhooks((env: { CONTY_WEBHOOK_SECRET: string }) => ({
		secret: env.CONTY_WEBHOOK_SECRET,
		onEvent: (event) => event.type,
	})),
};

// SvelteKit-style `{ request }` is accepted without a cast.
export const post = ({ request }: { request: Request }) => handler({ request });
