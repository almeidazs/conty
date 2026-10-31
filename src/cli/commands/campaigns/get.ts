import type { Command } from 'commander';

import { createClient } from '../../shared/auth';
import { globals } from '../../shared/input';
import { printResult } from '../../shared/output';

export const get = (parent: Command) =>
	parent
		.command('get <id>')
		.description(
			'Mostra uma campanha, com blocos, requisitos e cadeia de revisão.',
		)
		.action(async (id: string, _flags, command: Command) => {
			const options = globals(command);

			printResult(
				options,
				await (await createClient(options)).campaigns.get(id),
			);
		});
