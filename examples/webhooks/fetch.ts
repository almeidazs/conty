// Endpoint de webhook com a API padrão de `Request`, como no Cloudflare Workers.

import { Webhooks } from 'contyos/fetch';

interface Env {
	CONTY_WEBHOOK_SECRET: string;
}

export default {
	// No Workers o segredo fica no `env`, por isso a função.
	fetch: Webhooks<Env>((env) => ({
		secret: env.CONTY_WEBHOOK_SECRET,

		onApplicationApproved: ({ data }) => {
			console.log('Creator aprovado, missão', data.mission.id);
		},

		onEvent: ({ type }) => {
			console.log('Evento', type);
		},
	})),
};
