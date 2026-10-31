import type { Command } from 'commander';

import type { RESTGetCampaignsQuery } from '../../../modules/types';
import { createClient } from '../../shared/auth';
import { globals, toFields, withPaging } from '../../shared/input';
import { printList } from '../../shared/output';
import { CAMPAIGN_COLUMNS } from '../../types';

export const list = (parent: Command) =>
	withPaging(
		parent
			.command('list')
			.description(
				'Lista as campanhas da marca, da mais nova à mais antiga.',
			),
	)
		.option(
			'--status <status>',
			'status, separados por vírgula (approved,paused)',
		)
		.option('--q <texto>', 'busca pelo nome')
		.action(async ({ all, ...flags }, command: Command) => {
			const options = globals(command);
			const client = await createClient(options);
			const query = toFields(flags) as RESTGetCampaignsQuery;

			await printList(
				{ ...options, all },
				{
					page: () => client.campaigns.list(query),
					all: () => client.campaigns.iterate(query),
					columns: CAMPAIGN_COLUMNS,
				},
			);
		});
