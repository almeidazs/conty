import type { Command } from 'commander';

import type { RESTPostCouponBody } from '../../../modules/types';
import { createClient } from '../../shared/auth';
import { globals, readBody } from '../../shared/input';
import { printResult } from '../../shared/output';
import { DATA_FLAG, DATA_HELP } from '../../types';

export const create = (parent: Command) =>
	parent
		.command('create')
		.description(
			'Cria um cupom do creator (--mission-id) ou disponível (--campaign-id).',
		)
		.option(
			'--code <código>',
			'código do cupom (A-Z, 0-9, _ e -, de 3 a 40)',
		)
		.option(
			'--discount-description <texto>',
			'texto do desconto que o cupom dá',
		)
		.option('--mission-id <id>', 'missão do creator')
		.option(
			'--campaign-id <id>',
			'campanha (cupom disponível, sem creator)',
		)
		.option(DATA_FLAG, DATA_HELP)
		.action(async (flags, command: Command) => {
			const options = globals(command);
			const body = await readBody(command, flags, ['code']);

			if ((body.mission_id === void 0) === (body.campaign_id === void 0))
				command.error(
					'error: use --mission-id ou --campaign-id, um dos dois',
				);

			printResult(
				options,
				await (
					await createClient(options)
				).coupons.create(body as RESTPostCouponBody),
			);
		});
