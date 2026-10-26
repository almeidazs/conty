import type { ID, ISODateString } from '../common';
import type {
	APICoupon,
	APICouponSale,
	APICouponSaleStatus,
	APICouponStatus,
	APIPage,
} from '../payloads';
import type { RESTPaginationQuery } from './pagination';

type RESTPostCouponBaseBody = {
	/** Code of the coupon (`A-Z`, `0-9`, `_`, `-`, 3 to 40 characters). Edges are trimmed and letters uppercased. */
	code: string;
	/** Free text of the discount the coupon gives the customer (1 to 200 characters). */
	discount_description?: string;
};

/**
 * `POST /coupons`
 *
 * With `mission_id`, creates the creator's active coupon in the mission's
 * campaign. With `campaign_id`, creates an available coupon in the campaign,
 * to link to a creator later.
 */
export type RESTPostCouponBody = RESTPostCouponBaseBody &
	(
		| {
				/** Mission of the creator, the one from the `application.approved` webhook. */
				mission_id: ID;
				campaign_id?: never;
		  }
		| {
				/** Standalone campaign or agreement. */
				campaign_id: ID;
				mission_id?: never;
		  }
	);

/** `POST /coupons` */
export type RESTPostCouponResult = APICoupon;

/** `GET /coupons` */
export type RESTGetCouponsQuery = RESTPaginationQuery & {
	/** Only coupons of this campaign or agreement. */
	campaign_id?: ID;
	/** Only coupons of this source mission. */
	mission_id?: ID;
	/** Only coupons currently owned by this creator. */
	creator_id?: ID;
	/** `true` lists only coupons with a creator; `false`, only the ones available in the campaign. */
	assigned?: boolean;
	/** Only coupons with this status. */
	status?: APICouponStatus;
	/** Only the coupon with this code. */
	code?: string;
};

/** `GET /coupons` */
export type RESTGetCouponsResult = APIPage<APICoupon>;

/** `GET /coupons/{id}` */
export type RESTGetCouponResult = APICoupon;

/** `PATCH /coupons/{id}` */
export type RESTPatchCouponBody = {
	/** New code of the coupon. */
	code?: string;
	/** New text of the discount. `null` clears it. */
	discount_description?: string | null;
	/** `canceled` deactivates the coupon. There is no way back. */
	status?: 'canceled';
};

/** `PATCH /coupons/{id}` */
export type RESTPatchCouponResult = APICoupon;

/** `POST /coupons/{id}/assign` */
export type RESTPostCouponAssignBody = {
	/** Mission of the creator who gets the coupon, in the coupon's campaign. */
	mission_id: ID;
};

/** `POST /coupons/{id}/assign` */
export type RESTPostCouponAssignResult = APICoupon;

/** `POST /coupons/{id}/unassign` */
export type RESTPostCouponUnassignResult = APICoupon;

/** `PUT /coupons/{id}/sales/{external_id}` */
export type RESTPutCouponSaleBody = {
	/**
	 * What the customer paid for the products, in cents, with the coupon
	 * discount, without shipping or taxes.
	 */
	amount_cents: number;
	/** `canceled` refunds the sale. */
	status: APICouponSaleStatus;
	/** When the sale happened. Between the creation of the coupon and now. */
	occurred_at: ISODateString;
};

/** `PUT /coupons/{id}/sales/{external_id}`: `201` when created, `200` when updated. */
export type RESTPutCouponSaleResult = APICouponSale;

/** `GET /coupons/{id}/sales` */
export type RESTGetCouponSalesQuery = RESTPaginationQuery;

/** `GET /coupons/{id}/sales` */
export type RESTGetCouponSalesResult = APIPage<APICouponSale>;
