// Endpoint de webhook com Express.
//
// Uso:
//   CONTY_WEBHOOK_SECRET=whsec_... bun examples/webhooks/express.ts

import { Webhooks } from 'contyos/express';
import express from 'express';

const app = express();

app.post(
	'/webhooks/conty',

	// O corpo precisa chegar cru: um corpo já convertido não dá para verificar.
	express.raw({ type: 'application/json' }),

	Webhooks({
		secret: process.env.CONTY_WEBHOOK_SECRET ?? '',

		onApplicationApproved: ({ data }) => {
			console.log('Creator aprovado, missão', data.mission.id);
		},

		onEvent: ({ type }) => {
			console.log('Evento', type);
		},
	}),
);

app.listen(3000);
