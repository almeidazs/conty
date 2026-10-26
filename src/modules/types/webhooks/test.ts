import type {
	WebhookDataBase,
	WebhookEventBase,
	WebhookMission,
} from './envelope';
import type { WebhookSubmission, WebhookSubmissionFormat } from './mission';

/** Sent by the panel's "Send test" button, with fictional data. Endpoints receive it without subscribing. */
export type WebhookTestEvent = WebhookEventBase<
	'webhook.test',
	WebhookDataBase & {
		mission: WebhookMission;
		submission: WebhookSubmission & { format: WebhookSubmissionFormat };
	}
>;
