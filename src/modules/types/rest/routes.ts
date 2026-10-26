import type { ID } from '../common';

/**
 * Paths of the API, relative to its base URL (`https://api.appconty.com/public/v1`).
 *
 * @example
 * rest.get(Routes.coupon(id));
 */
export const Routes = {
	/** `GET` the brand that owns the key. */
	me: () => '/me' as const,

	/** `POST` create and `GET` list coupons. */
	coupons: () => '/coupons' as const,

	/** `GET` view and `PATCH` edit a coupon. */
	coupon: (couponId: ID) => `/coupons/${couponId}` as const,

	/** `POST` link an available coupon to a creator's mission. */
	couponAssign: (couponId: ID) => `/coupons/${couponId}/assign` as const,

	/** `POST` take the creator out of a coupon. */
	couponUnassign: (couponId: ID) => `/coupons/${couponId}/unassign` as const,

	/** `GET` list the sales of a coupon. */
	couponSales: (couponId: ID) => `/coupons/${couponId}/sales` as const,

	/** `PUT` create or update a sale by the id of your system. */
	couponSale: (couponId: ID, externalId: string) =>
		`/coupons/${couponId}/sales/${encodeURIComponent(externalId)}` as const,

	/** `GET` list campaigns. */
	campaigns: () => '/campaigns' as const,

	/** `GET` view a campaign. */
	campaign: (campaignId: ID) => `/campaigns/${campaignId}` as const,

	/** `GET` the stages of a campaign's board. */
	campaignStages: (campaignId: ID) =>
		`/campaigns/${campaignId}/stages` as const,

	/** `GET` the items of a stage of a campaign's board. */
	campaignItems: (campaignId: ID) =>
		`/campaigns/${campaignId}/items` as const,

	/** `GET` view a mission. */
	mission: (missionId: ID) => `/missions/${missionId}` as const,
} as const;
