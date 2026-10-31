import type { Command } from 'commander';

import { createClient } from '../../shared/auth';
import { globals } from '../../shared/input';
import { printResult } from '../../shared/output';

export const unassign = (parent: Command) =>
	parent
		.command('unassign <id>')
		.description(
			'Tira o creator do cupom, que continua ativo e disponível.',
		)
		.action(async (id: string, _flags, command: Command) => {
			const options = globals(command);

			printResult(
				options,
				await (await createClient(options)).coupons.unassign(id),
			);
		});
