// Lista as campanhas e mostra as etapas do quadro de cada uma.
//
// Uso:
//   CONTY_API_KEY=ck_live_... bun examples/board/campaigns.ts

import { Conty } from 'contyos';

const client = new Conty(process.env.CONTY_API_KEY);

const campaigns = client.campaigns.iterate({ status: 'approved,paused' });

for await (const campaign of campaigns) {
	console.log(campaign.id, campaign.name);

	// As etapas não são paginadas.
	const { stages } = await client.campaigns.stages(campaign.id).unwrap();

	for (const stage of stages) console.log(`  ${stage.label}: ${stage.count}`);
}
