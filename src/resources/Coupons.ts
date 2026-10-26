import type { REST, RequestOptions, RESTResult } from '../modules/rest';
import {
	type ID,
	type RESTGetCouponResult,
	type RESTGetCouponSalesQuery,
	type RESTGetCouponSalesResult,
	type RESTGetCouponsQuery,
	type RESTGetCouponsResult,
	type RESTPatchCouponBody,
	type RESTPatchCouponResult,
	type RESTPostCouponAssignBody,
	type RESTPostCouponAssignResult,
	type RESTPostCouponBody,
	type RESTPostCouponResult,
	type RESTPostCouponUnassignResult,
	type RESTPutCouponSaleBody,
	type RESTPutCouponSaleResult,
	Routes,
} from '../modules/types';

/** Coupons per creator, and their sales. */
export class Coupons {
	readonly #rest: REST;

	constructor(rest: REST) {
		this.#rest = rest;
	}

	/** Creates a coupon: the creator's (`mission_id`) or an available one (`campaign_id`). */
	create(
		body: RESTPostCouponBody,
		options?: RequestOptions,
	): Promise<RESTResult<RESTPostCouponResult>> {
		return this.#rest.post(Routes.coupons(), { ...options, body });
	}

	/** Lists the brand's coupons, newest first. */
	list(
		query?: RESTGetCouponsQuery,
		options?: RequestOptions,
	): Promise<RESTResult<RESTGetCouponsResult>> {
		return this.#rest.get(Routes.coupons(), { ...options, query });
	}

	/** Gets a coupon with its current rate and totals. */
	get(
		couponId: ID,
		options?: RequestOptions,
	): Promise<RESTResult<RESTGetCouponResult>> {
		return this.#rest.get(Routes.coupon(couponId), options);
	}

	/** Changes the code or the discount, or cancels the coupon (final). */
	update(
		couponId: ID,
		body: RESTPatchCouponBody,
		options?: RequestOptions,
	): Promise<RESTResult<RESTPatchCouponResult>> {
		return this.#rest.patch(Routes.coupon(couponId), { ...options, body });
	}

	/** Links an available coupon to the creator of a mission. */
	assign(
		couponId: ID,
		body: RESTPostCouponAssignBody,
		options?: RequestOptions,
	): Promise<RESTResult<RESTPostCouponAssignResult>> {
		return this.#rest.post(Routes.couponAssign(couponId), {
			...options,
			body,
		});
	}

	/** Takes the creator out of the coupon, which stays active and available. */
	unassign(
		couponId: ID,
		options?: RequestOptions,
	): Promise<RESTResult<RESTPostCouponUnassignResult>> {
		return this.#rest.post(Routes.couponUnassign(couponId), options);
	}

	/** Lists the sales of a coupon, newest first. */
	listSales(
		couponId: ID,
		query?: RESTGetCouponSalesQuery,
		options?: RequestOptions,
	): Promise<RESTResult<RESTGetCouponSalesResult>> {
		return this.#rest.get(Routes.couponSales(couponId), {
			...options,
			query,
		});
	}

	/** Creates or updates a sale by the id of your system. Idempotent. */
	upsertSale(
		couponId: ID,
		externalId: string,
		body: RESTPutCouponSaleBody,
		options?: RequestOptions,
	): Promise<RESTResult<RESTPutCouponSaleResult>> {
		return this.#rest.put(Routes.couponSale(couponId, externalId), {
			...options,
			body,
		});
	}
}
