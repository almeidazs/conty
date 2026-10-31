import type { Command } from 'commander';

import { assign } from './assign';
import { create } from './create';
import { get } from './get';
import { list } from './list';
import { sales } from './sales';
import { unassign } from './unassign';
import { update } from './update';
import { upsertSale } from './upsert-sale';

export const registerCoupons = (program: Command) => {
	const coupons = program
		.command('coupons')
		.description('Cupons por creator e suas vendas.');

	for (const register of [
		list,
		get,
		create,
		update,
		assign,
		unassign,
		sales,
		upsertSale,
	])
		register(coupons);
};
