import type { Command } from 'commander';

import type { RESTGetCouponSalesQuery } from '../../../modules/types';
import { createClient } from '../../shared/auth';
import { globals, toFields, withPaging } from '../../shared/input';
import { printList } from '../../shared/output';
import { SALE_COLUMNS } from '../../types';

export const sales = (parent: Command) =>
	withPaging(
		parent
			.command('sales <id>')
			.description('Lista as vendas de um cupom.'),
	).action(async (id: string, { all, ...flags }, command: Command) => {
		const options = globals(command);
		const client = await createClient(options);
		const query = toFields(flags) as RESTGetCouponSalesQuery;

		await printList(
			{ ...options, all },
			{
				page: () => client.coupons.listSales(id, query),
				all: () => client.coupons.iterateSales(id, query),
				columns: SALE_COLUMNS,
			},
		);
	});
