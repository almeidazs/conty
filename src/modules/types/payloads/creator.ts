import type { ID } from '../common';

/** Creator in coupons, sales and webhooks. */
export interface APICreatorSummary {
	/** Id of the creator. */
	id: ID;
	/** Name of the creator. */
	name: string;
	/** Creator's @, when there is one. */
	handle: string | null;
}

/** The creator's accounts on each network. */
export interface APICreatorHandles {
	/** @ on Instagram. */
	instagram: string | null;
	/** @ on TikTok. */
	tiktok: string | null;
	/** YouTube channel. */
	youtube: string | null;
}

/** Creator in the board and in missions. Never has email, phone, document or address. */
export interface APICreatorRef {
	/** Id of the creator. */
	id: ID;
	/** Name of the creator. */
	name: string | null;
	/** Accounts on each network. */
	handles: APICreatorHandles;
	/** Profile picture. */
	profile_image_url: string | null;
	/** Followers on Instagram. */
	instagram_followers: number | null;
}
