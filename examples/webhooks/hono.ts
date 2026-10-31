// Endpoint de webhook com Hono.
//
// Uso:
//   CONTY_WEBHOOK_SECRET=whsec_... bun examples/webhooks/hono.ts

import { Webhooks } from 'contyos/hono';
import { Hono } from 'hono';

const app = new Hono();

app.post(
	'/webhooks/conty',
	Webhooks({
		secret: process.env.CONTY_WEBHOOK_SECRET ?? '',

		// Um handler por evento, com o nome derivado do tipo.
		onApplicationApproved: ({ data }) => {
			console.log('Creator aprovado, missão', data.mission.id);
		},

		// Roda para os eventos que não têm handler próprio.
		// Se um handler lançar, a resposta é 500 e a Conty tenta de novo.
		onEvent: ({ type }) => {
			console.log('Evento', type);
		},
	}),
);

export default { port: 3000, fetch: app.fetch };
