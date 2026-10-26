import type { ID, ISODateString } from '../common';
import type {
	APIApplicationStatus,
	APICreatorSummary,
	APIMissionStatus,
} from '../payloads';

/** Network of a mission. */
export type WebhookPlatform = 'instagram' | 'tiktok' | 'youtube' | 'x';

/** What entered the approval in a submission. */
export type WebhookSubmissionItem = 'script' | 'video' | 'cover' | 'caption';

/** The brand that owns the campaign. */
export interface WebhookBrand {
	/** Id of the brand. */
	id: ID;
	/** Name of the brand. */
	name: string;
}

/** The campaign. In an agreement, the agreement's own `id` and `name`. */
export interface WebhookCampaign {
	/** Id of the campaign. */
	id: ID;
	/** Name of the campaign. */
	name: string;
	/** Link of the campaign in the panel. */
	url: string | null;
}

/** The creator's application. */
export interface WebhookApplication {
	/** Id of the application. */
	id: ID;
	/** Status of the application. */
	status: APIApplicationStatus;
}

/** The mission. */
export interface WebhookMission {
	/** Id of the mission. */
	id: ID;
	/** Status of the mission. */
	status: APIMissionStatus;
	/** Network of the mission. */
	platform: WebhookPlatform | null;
}

/** Fields common to every event's `data`. */
export interface WebhookDataBase {
	/** The brand that owns the campaign. */
	brand: WebhookBrand;
	/** The campaign. */
	campaign: WebhookCampaign;
	/** The creator. */
	creator: APICreatorSummary;
}

/** Envelope shared by every event. */
export interface WebhookEventBase<Type extends string, Data> {
	/** Id of the event. Same as the `X-Conty-Event-Id` header, in every attempt. */
	id: ID;
	/** Type of the event. */
	type: Type;
	/** When it happened. Use it to order events, delivery isn't ordered. */
	created_at: ISODateString;
	/** Environment that sent the event. */
	tenant: string;
	/** Ready sentence in Portuguese, with the brand, creator, action and campaign. */
	summary: string;
	/** Context of the event. Never has email, phone, document, address, fee or content. */
	data: Data;
}
