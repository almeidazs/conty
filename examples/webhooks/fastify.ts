// Endpoint de webhook com Fastify.
//
// Uso:
//   CONTY_WEBHOOK_SECRET=whsec_... bun examples/webhooks/fastify.ts

import { Webhooks } from 'contyos/fastify';
import Fastify from 'fastify';

const app = Fastify();

// O plugin tem o próprio parser de corpo cru: o resto do app continua recebendo JSON.
app.register(Webhooks, {
	path: '/webhooks/conty',
	secret: process.env.CONTY_WEBHOOK_SECRET ?? '',

	onApplicationApproved: ({ data }) => {
		console.log('Creator aprovado, missão', data.mission.id);
	},

	onEvent: ({ type }) => {
		console.log('Evento', type);
	},
});

await app.listen({ port: 3000 });
