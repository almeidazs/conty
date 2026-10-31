import type { Command } from 'commander';

import { createClient } from '../../shared/auth';
import { globals } from '../../shared/input';
import { printResult } from '../../shared/output';

export const get = (parent: Command) =>
	parent
		.command('get <id>')
		.description(
			'Mostra uma missão, com entregas, conteúdo, post, métricas e cupom.',
		)
		.action(async (id: string, _flags, command: Command) => {
			const options = globals(command);

			printResult(
				options,
				await (await createClient(options)).missions.get(id),
			);
		});
