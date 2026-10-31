import type { Command } from 'commander';

import type { RESTGetCampaignStagesQuery } from '../../../modules/types';
import { createClient } from '../../shared/auth';
import { globals, toFields } from '../../shared/input';
import { printResult } from '../../shared/output';

export const stages = (parent: Command) =>
	parent
		.command('stages <id>')
		.description(
			'Mostra as etapas do quadro, com contagens, ordenações e filtros.',
		)
		.option('--q <texto>', 'busca de creator: nome, @instagram ou @tiktok')
		.action(async (id: string, flags, command: Command) => {
			const options = globals(command);
			const client = await createClient(options);

			printResult(
				options,
				await client.campaigns.stages(
					id,
					toFields(flags) as RESTGetCampaignStagesQuery,
				),
			);
		});
