import { Conty } from 'contyos';
import type {
	APICoupon,
	RESTGetCampaignItemsResult,
	RESTPostCouponBody,
	WebhookEvent,
	WebhookEventOf,
} from 'contyos/types';
import { Routes } from 'contyos/types';

// A coupon needs a mission or a campaign, never both.
export const byMission: RESTPostCouponBody = { code: 'A1B', mission_id: 'x' };
export const byCampaign: RESTPostCouponBody = { code: 'A1B', campaign_id: 'x' };
// @ts-expect-error mission_id and campaign_id are mutually exclusive
export const both: RESTPostCouponBody = {
	code: 'A1B',
	mission_id: 'x',
	campaign_id: 'y',
};
// @ts-expect-error one of them is required
export const neither: RESTPostCouponBody = { code: 'A1B' };

export const path: `/coupons/${string}/assign` = Routes.couponAssign('x');

// Webhook events narrow by `type`.
export const handle = (event: WebhookEvent) => {
	if (event.type === 'application.approved') return event.data.mission.id;

	if (event.type === 'mission.video_submitted')
		return event.data.submission.format;

	return event.summary;
};
export const approved: WebhookEventOf<'mission.approved'>['type'] =
	'mission.approved';

export const run = async (client: Conty) => {
	const coupon = await client.coupons.get('x');

	if (!coupon.ok) return coupon.error.code;

	const data: APICoupon = coupon.data;
	const list: RESTGetCampaignItemsResult | undefined = undefined;

	return [data.creator?.name, list];
};
