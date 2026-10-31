import type { Command } from 'commander';

import { get } from './get';

export const registerMissions = (program: Command) =>
	get(program.command('missions').description('Missões dos creators.'));
