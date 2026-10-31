import type { Command } from 'commander';

import { get } from './get';
import { items } from './items';
import { list } from './list';
import { stages } from './stages';

export const registerCampaigns = (program: Command) => {
	const campaigns = program
		.command('campaigns')
		.description('Campanhas e o quadro de creators.');

	for (const register of [list, get, stages, items]) register(campaigns);
};
