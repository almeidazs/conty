// Três jeitos de tratar uma falha: o resultado, o `unwrap` e os guards.
//
// Uso:
//   CONTY_API_KEY=ck_live_... bun examples/errors/handling.ts

import {
	Conty,
	ContyError,
	isContyError,
	isNotFound,
	isRateLimited,
} from 'contyos';

const client = new Conty(process.env.CONTY_API_KEY);

const id = '4f2c7a1e-9b3d-4c8a-a1f0-6d2e8b7c5a10';

// 1. Nada lança: estreite o tipo com `ok`.
const result = await client.coupons.get(id);

if (result.ok) console.log(result.data.code);
else console.log(result.error.type, result.error.code, result.error.requestId);

// 2. O `.unwrap()` devolve os dados ou lança um `ContyError`.
try {
	await client.coupons.get(id).unwrap();
} catch (error) {
	if (error instanceof ContyError) console.log(error.status, error.code);
}

// 3. Os guards estreitam o erro pelo código, no resultado e no erro capturado.
const created = await client.coupons.create({
	code: 'FULANA10',
	mission_id: id,
});

if (isRateLimited(created))
	console.log('Tente de novo em', created.error.retryAfter, 'ms');
else if (isNotFound(created)) console.log('A missão não existe');
else if (isContyError(created, 'validation_failed'))
	console.log(created.error.details);

// 4. O `iterate` e o `pages` lançam: uma página com erro rejeita o loop.
try {
	for await (const coupon of client.coupons.iterate())
		console.log(coupon.code);
} catch (error) {
	if (isContyError(error, 'rate_limited'))
		console.log('Devagar com as chamadas');
}
