import type {
	WebhookApplication,
	WebhookDataBase,
	WebhookEventBase,
	WebhookMission,
} from './envelope';

/** The creator applied. There is no mission yet. */
export type WebhookApplicationCreatedEvent = WebhookEventBase<
	'application.created',
	WebhookDataBase & {
		application: WebhookApplication;
		mission: null;
	}
>;

/**
 * The brand approved the application and the creator has an open mission.
 * `data.mission.id` is the `mission_id` that `POST /coupons` expects.
 */
export type WebhookApplicationApprovedEvent = WebhookEventBase<
	'application.approved',
	WebhookDataBase & {
		application: WebhookApplication;
		mission: WebhookMission;
	}
>;

/** The brand or the agency rejected the application. */
export type WebhookApplicationRejectedEvent = WebhookEventBase<
	'application.rejected',
	WebhookDataBase & {
		application: WebhookApplication;
		mission: WebhookMission | null;
	}
>;

/** Events about applications. */
export type WebhookApplicationEvent =
	| WebhookApplicationCreatedEvent
	| WebhookApplicationApprovedEvent
	| WebhookApplicationRejectedEvent;
