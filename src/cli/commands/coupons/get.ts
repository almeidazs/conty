import type { Command } from 'commander';

import { createClient } from '../../shared/auth';
import { globals } from '../../shared/input';
import { printResult } from '../../shared/output';

export const get = (parent: Command) =>
	parent
		.command('get <id>')
		.description('Mostra um cupom, com a taxa e os totais.')
		.action(async (id: string, _flags, command: Command) => {
			const options = globals(command);

			printResult(
				options,
				await (await createClient(options)).coupons.get(id),
			);
		});
