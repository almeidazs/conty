import type { Command } from 'commander';

import type { RESTPostCouponAssignBody } from '../../../modules/types';
import { createClient } from '../../shared/auth';
import { globals, readBody } from '../../shared/input';
import { printResult } from '../../shared/output';
import { DATA_FLAG, DATA_HELP } from '../../types';

export const assign = (parent: Command) =>
	parent
		.command('assign <id>')
		.description('Vincula um cupom disponível ao creator de uma missão.')
		.option('--mission-id <id>', 'missão do creator que recebe o cupom')
		.option(DATA_FLAG, DATA_HELP)
		.action(async (id: string, flags, command: Command) => {
			const options = globals(command);
			const body = await readBody(command, flags, ['mission_id']);

			printResult(
				options,
				await (
					await createClient(options)
				).coupons.assign(id, body as RESTPostCouponAssignBody),
			);
		});
