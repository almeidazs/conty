// Percorre os creators de uma etapa do quadro, com filtros, e abre uma missão.
//
// Uso:
//   CONTY_API_KEY=ck_live_... CAMPAIGN_ID=... bun examples/board/items.ts

import { Conty } from 'contyos';

const client = new Conty(process.env.CONTY_API_KEY);

const campaignId = process.env.CAMPAIGN_ID ?? '';

// 1. Item por item. A etapa e os filtros valem para todas as páginas.
const interested = client.campaigns.iterateItems(campaignId, {
	stage: 'interested',
	only_compatible: true,
	followers_min: 10_000,
	sort: 'match',
	limit: 50,
});

for await (const item of interested) {
	if (item.kind === 'application') {
		console.log(item.id, item.status_label);
	}
}

// 2. Página por página, quando você precisa do total que o quadro devolve.
const submitted = client.campaigns.itemsPages(campaignId, {
	stage: 'submitted',
});

for await (const page of submitted) {
	console.log(`${page.data.length} de ${page.total}`);
}

// 3. Abrir a primeira missão da etapa.
for await (const item of client.campaigns.iterateItems(campaignId, {
	stage: 'submitted',
})) {
	if (item.kind !== 'mission') continue;

	const mission = await client.missions.get(item.id).unwrap();

	console.log(mission.campaign.name);

	break;
}
