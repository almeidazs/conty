// Endpoint de webhook com Elysia.
//
// Uso:
//   CONTY_WEBHOOK_SECRET=whsec_... bun examples/webhooks/elysia.ts

import { Webhooks } from 'contyos/elysia';
import { Elysia } from 'elysia';

new Elysia()
	.post(
		'/webhooks/conty',
		Webhooks({
			secret: process.env.CONTY_WEBHOOK_SECRET ?? '',

			onApplicationApproved: ({ data }) => {
				console.log('Creator aprovado, missão', data.mission.id);
			},

			onEvent: ({ type }) => {
				console.log('Evento', type);
			},
		}),
	)
	.listen(3000);
