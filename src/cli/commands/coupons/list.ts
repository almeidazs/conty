import type { Command } from 'commander';

import type { RESTGetCouponsQuery } from '../../../modules/types';
import { createClient } from '../../shared/auth';
import { globals, toFields, withPaging } from '../../shared/input';
import { printList } from '../../shared/output';
import { COUPON_COLUMNS } from '../../types';

export const list = (parent: Command) =>
	withPaging(
		parent
			.command('list')
			.description(
				'Lista os cupons da marca, do mais novo ao mais antigo.',
			),
	)
		.option('--campaign-id <id>', 'só os cupons desta campanha')
		.option('--mission-id <id>', 'só os cupons desta missão')
		.option('--creator-id <id>', 'só os cupons deste creator')
		.option('--assigned', 'só os cupons com creator')
		.option('--no-assigned', 'só os cupons disponíveis na campanha')
		.option('--status <status>', 'só os cupons com este status')
		.option('--code <código>', 'só o cupom com este código')
		.action(async ({ all, ...flags }, command: Command) => {
			const options = globals(command);
			const client = await createClient(options);
			const query = toFields(flags) as RESTGetCouponsQuery;

			await printList(
				{ ...options, all },
				{
					page: () => client.coupons.list(query),
					all: () => client.coupons.iterate(query),
					columns: COUPON_COLUMNS,
				},
			);
		});
