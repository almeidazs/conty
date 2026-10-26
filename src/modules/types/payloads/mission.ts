import type { ID, ISODate, ISODateString } from '../common';
import type { APIBoardStageId } from './board';
import type { APICampaignKind, APICampaignPlatform } from './campaign';
import type { APICreatorRef } from './creator';

/**
 * Raw status of a mission. To display it, use `status_label` and
 * `status_tone`, which come as the panel shows them.
 */
export type APIMissionStatus =
	| 'convidado'
	| 'fazendo'
	| 'em_analise'
	| 'editado'
	| 'aprovado'
	| 'recusado'
	| 'recusado_permanentemente'
	| 'expirado'
	| null;

/** Color of a status in the panel. */
export type APIStatusTone =
	| 'success'
	| 'muted'
	| 'info'
	| 'warning'
	| 'destructive';

/** A delivery of the mission: script, cover, caption or the video. */
export type APIMissionStepId = 'cover' | 'caption' | 'script' | 'delivery';

/**
 * `review` waits for review, `awaiting` waits for the creator, `idle` hasn't
 * started and `locked` isn't asked for by the campaign.
 */
export type APIMissionStepState =
	| 'approved'
	| 'rejected'
	| 'review'
	| 'awaiting'
	| 'idle'
	| 'locked';

/** A delivery of the mission and where it is. */
export interface APIMissionStep {
	/** Which delivery it is. */
	id: APIMissionStepId;
	/** Label in the panel. */
	label: string;
	/** State of the delivery. */
	state: APIMissionStepState;
	/** Whose turn it is, as the panel shows. */
	waiting_on: string | null;
	/** `true` when the review chain hasn't released the content to the brand yet. */
	content_hidden: boolean;
}

/** Link of the published post, per network. */
export interface APIMissionPostUrls {
	instagram: string | null;
	tiktok: string | null;
	youtube: string | null;
	x: string | null;
}

/** Numbers of the published post. */
export interface APIMissionMetrics {
	/** Views of the post. */
	views: number;
	/** Likes of the post. */
	likes: number;
	/** Comments of the post. */
	comments: number;
}

/** Dates of the mission. */
export interface APIMissionDates {
	/** When the creator accepted. */
	accepted_at: ISODateString | null;
	/** When the briefing was sent to the creator. */
	sent_at: ISODateString | null;
	/** First delivery of the creator. */
	first_submitted_at: ISODateString | null;
	/** When the delivery was approved. */
	approved_at: ISODateString | null;
	/** Deadline of the script. */
	script_deadline_at: ISODateString | null;
	/** Deadline of the requested change. */
	change_deadline_at: ISODateString | null;
}

/** Active coupon of the creator in the campaign. */
export interface APIMissionCoupon {
	/** Id of the coupon. */
	id: ID;
	/** Coupon code. */
	code: string;
	/** Text of the discount. */
	discount_description: string | null;
	/** Commission rate in basis points. `null` when money isn't visible or there is no rate. */
	commission_rate_bps: number | null;
	/** Confirmed sales. */
	sales_count: number;
	/** Sum of the confirmed sales, in cents. */
	revenue_cents: number;
	/** Commission of the confirmed sales, in cents. `null` when money isn't visible. */
	commission_cents: number | null;
}

/** A creator's mission in a campaign, as listed in the board. */
export interface APIMissionItem {
	kind: 'mission';
	/** Id of the mission. */
	id: ID;
	/** Root campaign: the agreement, or the standalone one. */
	campaign_id: ID;
	/** Block of the agreement the mission belongs to. `null` on a standalone campaign. */
	block: {
		/** Id of the block. */
		id: ID;
		/** Delivery format of the block. */
		platform: APICampaignPlatform | null;
	} | null;
	/** Creator of the mission. */
	creator: APICreatorRef;
	/** Raw status. */
	status: APIMissionStatus;
	/** Status as the panel shows it. */
	status_label: string;
	/** Color of the status. */
	status_tone: APIStatusTone;
	/** Stage of the board the mission is in. */
	stage: APIBoardStageId | null;
	/** Deliveries of the mission, in order. */
	steps: APIMissionStep[];
	/** Link of the post, per network. */
	post_urls: APIMissionPostUrls;
	/** When the post was published. */
	posted_at: ISODateString | null;
	/** Numbers of the post. */
	metrics: APIMissionMetrics;
	/** Dates of the mission. */
	dates: APIMissionDates;
	/** What the creator receives for the mission, in cents. `null` when money isn't visible. */
	payment_amount_cents: number | null;
	/** Active coupon of the creator in the campaign. `null` without a coupon. */
	coupon: APIMissionCoupon | null;
	/** The creator meets the profile the campaign asks for. */
	is_compatible: boolean;
	/** Why the creator is compatible, as the panel shows. */
	match_tags: string[];
	/** Day the mission was created. */
	created_at: ISODate;
}

/** What the creator delivered. `null` for what the review chain hasn't released to the brand. */
export interface APIMissionContent {
	/** Link to play the delivered video. */
	video_url: string | null;
	/** Thumbnail of the video. */
	thumbnail_url: string | null;
	/** Delivered cover. */
	cover_url: string | null;
	/** Delivered caption. */
	caption: string | null;
	/** Delivered script. */
	script: string | null;
}

/** A mission with its campaign and delivered content. */
export interface APIMission extends APIMissionItem {
	/** Root campaign of the mission: the agreement when there is one. */
	campaign: {
		/** Id of the root campaign. */
		id: ID;
		/** Kind of campaign. */
		kind: APICampaignKind;
		/** Name of the campaign. */
		name: string | null;
	};
	/** What the creator delivered. */
	content: APIMissionContent;
}
