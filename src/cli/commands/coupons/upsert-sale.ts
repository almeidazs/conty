import type { Command } from 'commander';

import type { RESTPutCouponSaleBody } from '../../../modules/types';
import { createClient } from '../../shared/auth';
import { globals, readBody, toNumber } from '../../shared/input';
import { printResult } from '../../shared/output';
import { DATA_FLAG, DATA_HELP } from '../../types';

export const upsertSale = (parent: Command) =>
	parent
		.command('upsert-sale <id> <external-id>')
		.description(
			'Cria ou atualiza uma venda pelo id do seu sistema. Idempotente.',
		)
		.option(
			'--amount-cents <centavos>',
			'o que o cliente pagou pelos produtos, com o desconto',
			toNumber,
		)
		.option('--status <status>', 'confirmed, ou canceled para estornar')
		.option('--occurred-at <ISO 8601>', 'quando a venda aconteceu')
		.option(DATA_FLAG, DATA_HELP)
		.action(
			async (id: string, externalId: string, flags, command: Command) => {
				const options = globals(command);
				const body = await readBody(command, flags, [
					'amount_cents',
					'status',
					'occurred_at',
				]);

				printResult(
					options,
					await (
						await createClient(options)
					).coupons.upsertSale(
						id,
						externalId,
						body as RESTPutCouponSaleBody,
					),
				);
			},
		);
