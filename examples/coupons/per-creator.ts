// Cupom por creator, do começo ao fim: criar, registrar vendas e cancelar.
//
// Uso:
//   CONTY_API_KEY=ck_live_... MISSION_ID=... bun examples/coupons/per-creator.ts

import { Conty, isCouponExists } from 'contyos';

const client = new Conty(process.env.CONTY_API_KEY);

// A missão vem do webhook `application.approved`.
const missionId = process.env.MISSION_ID ?? '';

// 1. Criar o cupom do creator.
const created = await client.coupons.create({
	code: 'FULANA10',
	discount_description: '10% de desconto no primeiro pedido',
	mission_id: missionId,
});

// O código é único entre os cupons ativos da marca.
// Se ele já existe, a API devolve o id do cupom em `details`.
if (isCouponExists(created)) {
	console.log('Esse cupom já existe:', created.error.details[0]?.coupon_id);

	process.exit(0);
}

if (!created.ok) {
	console.error('Não foi possível criar o cupom:', created.error.message);

	process.exit(1);
}

const coupon = created.data;

// 2. Registrar a venda, usando o id do pedido no seu sistema como `external_id`.
// É idempotente: repetir a chamada atualiza a venda e nunca duplica.
const sale = await client.coupons
	.upsertSale(coupon.id, 'pedido-10293', {
		amount_cents: 15_000,
		status: 'confirmed',
		occurred_at: new Date().toISOString(),
	})
	.unwrap();

console.log('Comissão (centavos):', sale.commission_cents);

// 3. Estornar a venda: a mesma chamada, com outro status.
await client.coupons
	.upsertSale(coupon.id, 'pedido-10293', {
		amount_cents: 15_000,
		status: 'canceled',
		occurred_at: new Date().toISOString(),
	})
	.unwrap();

// 4. Cancelar o cupom. É definitivo, mas as vendas continuam lá.
await client.coupons.update(coupon.id, { status: 'canceled' }).unwrap();
