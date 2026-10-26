import type { WebhookApplicationEvent } from './application';
import type { WebhookMissionEvent } from './mission';
import type { WebhookTestEvent } from './test';

export type * from './application';
export type * from './envelope';
export type * from './mission';
export type * from './test';

/** Any event Conty sends to a webhook endpoint. */
export type WebhookEvent =
	| WebhookApplicationEvent
	| WebhookMissionEvent
	| WebhookTestEvent;

/** `type` of every event. */
export type WebhookEventType = WebhookEvent['type'];

/** The event of a given type, e.g. `WebhookEventOf<'mission.approved'>`. */
export type WebhookEventOf<Type extends WebhookEventType> = Extract<
	WebhookEvent,
	{ type: Type }
>;
