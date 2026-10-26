import type { ID, ISODate, ISODateString } from '../common';

/** `agreement` has one block per platform; `campaign` is standalone, without an agreement. */
export type APICampaignKind = 'agreement' | 'campaign';

/** Same as the panel: draft, in review, live, paused, completed or archived. */
export type APICampaignStatus =
	| 'draft'
	| 'review'
	| 'approved'
	| 'paused'
	| 'completed'
	| 'archived';

/** Delivery format of a block. */
export type APICampaignPlatform =
	| 'reels_collab'
	| 'story_sequencia'
	| 'tiktok'
	| 'apenas_video'
	| 'x_twitter'
	| 'youtube_longo'
	| 'youtube_shorts'
	| 'feed'
	| 'video_vertical'
	| 'repost';

/** `per_video` pays a fixed value per content, `per_view` pays by views and `permuta` pays only with product. */
export type APIPaymentType = 'per_view' | 'per_video' | 'permuta' | null;

/** Who reviews each delivery. With an agency in the middle, it approves before the brand. */
export type APIReviewer = 'brand' | 'agency' | 'group' | 'partner';

/** Payment by views. */
export interface APICampaignPerView {
	/** What the creator earns per 1,000 views, in cents. */
	amount_per_1000_views_cents: number | null;
	/** Minimum value per content, in cents. */
	min_cents: number | null;
	/** Cap per content, in cents. `null` when there is no cap. */
	max_cents: number | null;
	/** Every how many views the bonus is paid. */
	bonus_every_views: number | null;
	/** Cap of the bonus, in cents. */
	bonus_cap_cents: number | null;
}

/** Product of the barter. */
export interface APICampaignProduct {
	/** Name of the product. */
	item: string | null;
	/** Reference value of the product, in cents. */
	value_cents: number | null;
	/** Description of the product. */
	description: string | null;
}

/** How the creator is paid. Money fields are `null` when `money_visible` is false. */
export interface APICampaignPayment {
	/** Type of payment. */
	type: APIPaymentType;
	/** Value per content, in cents. `null` on `per_view` and pure barter. */
	amount_per_content_cents: number | null;
	/** Payment by views. `null` outside `per_view`. */
	per_view: APICampaignPerView | null;
	/** Product of the barter. `null` when the campaign offers no product. */
	product: APICampaignProduct | null;
	/** Days to pay the creator after approval. */
	payment_terms_days: number | null;
}

/** A campaign in a list. */
export interface APICampaign {
	/**
	 * Id of the campaign: the agreement's, or the standalone one. The same as
	 * `data.campaign.id` in webhooks and `campaign.id` in coupons.
	 */
	id: ID;
	/** Kind of campaign. */
	kind: APICampaignKind;
	/** Name of the campaign. */
	name: string | null;
	/** Status of the campaign. */
	status: APICampaignStatus;
	/** Delivery formats. In an agreement, one per block. */
	platforms: APICampaignPlatform[];
	/** Start of the campaign. */
	start_date: ISODate | null;
	/** End of the campaign. `null` when it has no end. */
	end_date: ISODate | null;
	/** When the campaign was created. */
	created_at: ISODateString;
	/** How the creator is paid. */
	payment: APICampaignPayment;
	/** Budget, in cents. */
	budget_cents: number | null;
	/** Spent on approved deliveries, in cents. */
	spent_cents: number | null;
	/**
	 * `false` when the agency didn't release prices to an assisted brand: then
	 * every `_cents` and `_bps` field is `null`.
	 */
	money_visible: boolean;
	/** Cap of creators. `null` when there is no cap. */
	creators_limit: number | null;
	/** Creators with a mission in the campaign. */
	creators_count: number;
	/** Link of the campaign in the brand's panel. */
	panel_url: string;
}

/** What the campaign requires from the creator. */
export interface APICampaignRequires {
	/** The brand approves the script before the video. */
	script: boolean;
	/** The brand approves the cover. */
	cover: boolean;
	/** The brand approves the caption. */
	caption: boolean;
	/** The creator informs the ad code. */
	ad_code: boolean;
	/** The brand ships a product to the creator. */
	product_shipping: boolean;
}

/** Block of a platform, with the deadlines the brand configured. */
export interface APICampaignBlock {
	/** Id of the block. In a standalone campaign, the campaign's own id. */
	id: ID;
	/** Delivery format of the block. */
	platform: APICampaignPlatform | null;
	/** Video format asked for in the block. */
	video_format: string | null;
	/** Contents each creator delivers in this block. */
	quantity: number;
	/** Status of the block. */
	status: APICampaignStatus | null;
	/** Deadline of the script. */
	script_deadline: ISODateString | null;
	/** Deadline of the delivery. */
	delivery_deadline: ISODateString | null;
	/** Date set for posting, when the campaign defines one. */
	posting_date: ISODateString | null;
}

/** Package of deliveries a creator can close in the agreement. */
export interface APICampaignScopeOption {
	/** Id of the scope option. */
	id: ID;
	/** Name of the option. */
	name: string;
	/** Deliveries of the option, per block. */
	items: {
		/** Block of the delivery. */
		block_id: ID;
		/** How many contents of the block the option asks for. */
		quantity: number;
	}[];
	/** Amount paid to the creator for the option, in cents. */
	amount_cents: number | null;
}

/** A campaign with blocks, requirements and review chain. */
export interface APICampaignDetail extends APICampaign {
	/** Description of the campaign. */
	description: string | null;
	/** Objective of the campaign. */
	objective: string | null;
	/** Who reviews each delivery, in order. */
	review_chain: APIReviewer[];
	/** What the campaign requires from the creator. */
	requires: APICampaignRequires;
	/** Blocks of the campaign. A standalone one has a single block, itself. */
	blocks: APICampaignBlock[];
	/** Scope options of the agreement. Empty on a standalone campaign. */
	scope_options: APICampaignScopeOption[];
}
