// Retry, timeout, cancelamento e hooks do cliente REST.
//
// Uso:
//   CONTY_API_KEY=ck_live_... bun examples/errors/observability.ts

import { Conty } from 'contyos';

const client = new Conty({
	secret: process.env.CONTY_API_KEY,
	rest: {
		retries: 3,
		timeout: 10_000,

		hooks: {
			onRequest: ({ method, url, attempt }) => {
				console.log(`-> ${method} ${url} (tentativa ${attempt})`);
			},

			onResponse: ({ status, duration }) => {
				console.log(`<- ${status} em ${duration}ms`);
			},

			onRetry: ({ attempt, delay, error }) => {
				console.log(`retry #${attempt} em ${delay}ms: ${error.type}`);
			},

			onError: ({ error }) => {
				console.error('Falhou de vez:', error.message);
			},
		},
	},
});

// Um `signal` cancela a requisição, e as tentativas junto com ela.
const controller = new AbortController();

setTimeout(() => controller.abort(), 5_000);

const me = await client.me({ signal: controller.signal });

console.log(me.ok ? me.data.enterprise.name : me.error.type);
