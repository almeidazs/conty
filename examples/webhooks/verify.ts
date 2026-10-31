// Verifica a assinatura e lê o evento sem framework.

import { construct, verify } from 'contyos/webhooks';

export const receive = async (request: Request) => {
	const options = {
		body: await request.text(),
		header: request.headers.get('x-conty-signature'),
		secret: process.env.CONTY_WEBHOOK_SECRET ?? '',
	};

	// Entrega inválida ou adulterada: 400.
	if (!(await verify(options))) return new Response(null, { status: 400 });

	// O `construct` também verifica, e devolve o evento tipado ou `null`.
	const event = await construct(options);

	console.log('Evento', event?.type);

	return new Response(null, { status: 200 });
};
