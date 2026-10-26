import type {
	WebhookDataBase,
	WebhookEventBase,
	WebhookMission,
	WebhookPlatform,
	WebhookSubmissionItem,
} from './envelope';

/** Format of a delivery. */
export type WebhookSubmissionFormat = 'video' | 'image' | 'text' | 'link';

/** What the creator submitted. */
export interface WebhookSubmission {
	/** What entered the approval in this action. */
	items: WebhookSubmissionItem[];
	/** `true` when the mission already had a previous version of that content. */
	resubmission: boolean;
}

type MissionData = WebhookDataBase & { mission: WebhookMission };

/** The creator accepted the invite or started the mission. */
export type WebhookMissionAcceptedEvent = WebhookEventBase<
	'mission.accepted',
	MissionData
>;

/** The script entered the approval, including a resubmission. */
export type WebhookMissionScriptSubmittedEvent = WebhookEventBase<
	'mission.script_submitted',
	MissionData & { submission: WebhookSubmission }
>;

/** The cover was sent after the delivery. A cover sent with the video comes in `mission.video_submitted`. */
export type WebhookMissionCoverSubmittedEvent = WebhookEventBase<
	'mission.cover_submitted',
	MissionData & { submission: WebhookSubmission }
>;

/** The caption was sent after the delivery. Its text isn't in the payload. */
export type WebhookMissionCaptionSubmittedEvent = WebhookEventBase<
	'mission.caption_submitted',
	MissionData & { submission: WebhookSubmission }
>;

/** The delivery was sent or resent. Cover and caption sent along come in `items`. */
export type WebhookMissionVideoSubmittedEvent = WebhookEventBase<
	'mission.video_submitted',
	MissionData & {
		submission: WebhookSubmission & {
			/** Format of the delivery. */
			format: WebhookSubmissionFormat;
		};
	}
>;

/** The link of the post was confirmed in the mission. A rejected link doesn't fire an event. */
export type WebhookMissionPostLinkAddedEvent = WebhookEventBase<
	'mission.post_link_added',
	MissionData & {
		post: {
			/** Url of the post. */
			url: string;
			/** Network of the post. */
			platform: WebhookPlatform;
			/** Who informed the link. */
			by: 'creator' | 'agency' | 'brand';
		};
	}
>;

/** The brand or the agency asked for changes. The text of the request is never in the payload. */
export type WebhookMissionChangesRequestedEvent = WebhookEventBase<
	'mission.changes_requested',
	MissionData & {
		request: {
			/** What the creator has to redo. */
			items: WebhookSubmissionItem[];
		};
	}
>;

/** The delivery was approved and the mission is done. */
export type WebhookMissionApprovedEvent = WebhookEventBase<
	'mission.approved',
	MissionData
>;

/** The mission was rejected for good. */
export type WebhookMissionRejectedEvent = WebhookEventBase<
	'mission.rejected',
	WebhookDataBase & {
		mission: WebhookMission & {
			/** `brand` when the brand or agency rejected the content; `creator` when the creator rejected the campaign. */
			rejected_by: 'brand' | 'creator';
		};
	}
>;

/** The mission expired. */
export type WebhookMissionExpiredEvent = WebhookEventBase<
	'mission.expired',
	MissionData
>;

/** The brand removed the creator from the campaign and the mission was deleted. */
export type WebhookMissionCanceledEvent = WebhookEventBase<
	'mission.canceled',
	MissionData
>;

/** Events about missions. */
export type WebhookMissionEvent =
	| WebhookMissionAcceptedEvent
	| WebhookMissionScriptSubmittedEvent
	| WebhookMissionCoverSubmittedEvent
	| WebhookMissionCaptionSubmittedEvent
	| WebhookMissionVideoSubmittedEvent
	| WebhookMissionPostLinkAddedEvent
	| WebhookMissionChangesRequestedEvent
	| WebhookMissionApprovedEvent
	| WebhookMissionRejectedEvent
	| WebhookMissionExpiredEvent
	| WebhookMissionCanceledEvent;
