import type { ID, ISODateString } from '../common';
import type { APICreatorSummary } from './creator';

/** `canceled` is final. */
export type APICouponStatus = 'active' | 'canceled';

/** Campaign of a coupon. In an agreement, the whole agreement. */
export interface APICouponCampaign {
	/** Id of the standalone campaign or agreement. */
	id: ID;
	/** Name of the campaign. */
	name: string;
}

/** Sums over the confirmed sales of a coupon. */
export interface APICouponTotals {
	/** Number of confirmed sales. */
	sales_count: number;
	/** Sum of the confirmed sales, in cents. */
	revenue_cents: number;
	/** Sum of the commission of the confirmed sales, in cents. `null` when no sale has a rate. */
	commission_cents: number | null;
	/** Commission reserved in the budget and not paid yet, in cents. */
	commission_reserved_cents: number;
	/** Commission already paid to the creator, in cents. */
	commission_paid_cents: number;
	/** Commission waiting for the brand's budget, in cents. */
	commission_awaiting_cents: number;
}

/** A creator's coupon, or one available in the campaign when it has no creator. */
export interface APICoupon {
	/** Id of the coupon. */
	id: ID;
	/** Coupon code. */
	code: string;
	/** Text of the discount, when informed. */
	discount_description: string | null;
	/** Status of the coupon. */
	status: APICouponStatus;
	/** Campaign of the coupon. */
	campaign: APICouponCampaign;
	/** Owner of the coupon. `null` when it is available in the campaign. */
	creator: APICreatorSummary | null;
	/** Mission of the owner. `null` when the coupon is available. */
	mission_id: ID | null;
	/**
	 * Current commission rate of the campaign, in basis points (`2500` is 25%).
	 * `null` when the campaign has no rate; `0` is a tracking only coupon.
	 */
	commission_rate_bps: number | null;
	/** Totals of the confirmed sales. */
	totals: APICouponTotals;
	/** When the coupon was created. */
	created_at: ISODateString;
	/** When the coupon was last updated. */
	updated_at: ISODateString;
	/** When the coupon was canceled. */
	canceled_at: ISODateString | null;
}
