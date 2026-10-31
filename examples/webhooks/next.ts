// Endpoint de webhook no App Router do Next.js.
// Salve como `app/api/webhooks/conty/route.ts`.

import { Webhooks } from 'contyos/next';

export const POST = Webhooks({
	secret: process.env.CONTY_WEBHOOK_SECRET ?? '',

	onApplicationApproved: ({ data }) => {
		console.log('Creator aprovado, missão', data.mission.id);
	},

	onEvent: ({ type }) => {
		console.log('Evento', type);
	},
});
