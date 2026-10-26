import type { ID, ISODate, ISODateString } from '../common';
import type { APICreatorSummary } from './creator';

/** Only `confirmed` sales count in the totals. */
export type APICouponSaleStatus = 'confirmed' | 'canceled';

/**
 * Payment of the commission of a sale. `null` when the coupon commission isn't
 * enabled for the brand.
 */
export type APICouponCommissionStatus =
	| 'none'
	| 'reserved'
	| 'awaiting_budget'
	| 'no_commission'
	| 'after_campaign_end'
	| 'released'
	| 'paid'
	| 'reversed'
	| null;

/** A sale made with a coupon. */
export interface APICouponSale {
	/** Id of the sale in Conty. */
	id: ID;
	/** Id of the sale in your system. */
	external_id: string;
	/**
	 * What the customer paid for the products, in cents, with the coupon
	 * discount, without shipping or taxes. The commission is calculated on it.
	 */
	amount_cents: number;
	/** Status of the sale. */
	status: APICouponSaleStatus;
	/**
	 * Creator the sale is attributed to: the coupon owner when the sale was
	 * created. Doesn't change if the coupon changes owner. `null` when the
	 * coupon was available.
	 */
	creator: APICreatorSummary | null;
	/** Mission of the creator when the sale was made. */
	mission_id: ID | null;
	/** Campaign rate when the sale was created, in basis points. Never changes. */
	commission_rate_bps: number | null;
	/** Commission of the sale, in cents. `null` when there is no rate. */
	commission_cents: number | null;
	/** Payment of the commission. */
	commission_status: APICouponCommissionStatus;
	/**
	 * Deadline of the commission: payment day when reserved, or the last day
	 * for the brand to add budget when awaiting budget.
	 */
	commission_due_on: ISODate | null;
	/** When the commission was paid to the creator. */
	commission_paid_at: ISODateString | null;
	/** When the paid commission was reversed by the cancellation of the sale. */
	commission_reversed_at: ISODateString | null;
	/** When the sale happened. */
	occurred_at: ISODateString;
	/** When the sale was registered. */
	created_at: ISODateString;
	/** When the sale was last updated. */
	updated_at: ISODateString;
}
