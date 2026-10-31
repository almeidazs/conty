// Soma as vendas confirmadas de todos os cupons de uma campanha.
//
// Uso:
//   CONTY_API_KEY=ck_live_... CAMPAIGN_ID=... bun examples/coupons/sales.ts

import { Conty } from 'contyos';

const client = new Conty(process.env.CONTY_API_KEY);

let totalCents = 0;

const coupons = client.coupons.iterate({
	campaign_id: process.env.CAMPAIGN_ID,
});

for await (const coupon of coupons) {
	// As vendas de cada cupom também são paginadas.
	for await (const sale of client.coupons.iterateSales(coupon.id)) {
		if (sale.status === 'confirmed') {
			totalCents += sale.amount_cents;
		}
	}
}

console.log(`Vendas confirmadas: R$ ${(totalCents / 100).toFixed(2)}`);
