// Cupons disponíveis: criados na campanha primeiro, vinculados a um creator depois.
//
// Uso:
//   CONTY_API_KEY=ck_live_... CAMPAIGN_ID=... MISSION_ID=... bun examples/coupons/available.ts

import { Conty } from 'contyos';

const client = new Conty(process.env.CONTY_API_KEY);

const campaignId = process.env.CAMPAIGN_ID ?? '';
const missionId = process.env.MISSION_ID ?? '';

// 1. Criar cupons só com `campaign_id`: eles ainda não têm dono.
for (const code of ['VERAO10', 'VERAO15', 'VERAO20'])
	await client.coupons.create({ code, campaign_id: campaignId }).unwrap();

// 2. Percorrer os cupons livres. O `iterate` só busca a próxima página quando precisa.
const available = client.coupons.iterate({
	campaign_id: campaignId,
	assigned: false,
	status: 'active',
});

for await (const coupon of available) {
	// Repetir o `assign` com a mesma missão não muda nada.
	const result = await client.coupons.assign(coupon.id, {
		mission_id: missionId,
	});

	if (result.ok) {
		console.log(`${coupon.code} agora é do creator`);

		break;
	}

	// Em `409 coupon_assigned`, outro evento pegou o cupom primeiro: tente o próximo.
	console.log(`${coupon.code} não ficou livre:`, result.error.code);
}
