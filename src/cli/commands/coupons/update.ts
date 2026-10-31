import type { Command } from 'commander';

import type { RESTPatchCouponBody } from '../../../modules/types';
import { createClient } from '../../shared/auth';
import { globals, readBody } from '../../shared/input';
import { printResult } from '../../shared/output';
import { DATA_FLAG, DATA_HELP } from '../../types';

export const update = (parent: Command) =>
	parent
		.command('update <id>')
		.description('Troca o código ou o desconto, ou cancela o cupom.')
		.option('--code <código>', 'novo código')
		.option('--discount-description <texto>', 'novo texto do desconto')
		.option('--status <canceled>', 'canceled desativa o cupom, para sempre')
		.option(DATA_FLAG, DATA_HELP)
		.action(async (id: string, flags, command: Command) => {
			const options = globals(command);
			const body = await readBody(command, flags);

			if (Object.keys(body).length === 0)
				command.error('error: diga o que mudar');

			printResult(
				options,
				await (
					await createClient(options)
				).coupons.update(id, body as RESTPatchCouponBody),
			);
		});
