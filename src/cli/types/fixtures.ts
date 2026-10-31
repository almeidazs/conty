import type {
	WebhookDataBase,
	WebhookEventOf,
	WebhookEventType,
	WebhookMission,
} from '../../modules/types';

/** The fictional people and things of an event. */
export interface Seed extends WebhookDataBase {
	application: { id: string; status: 'pending' | 'approved' | 'rejected' };
	mission: WebhookMission;
}

/** Builds the `summary` and `data` of an event. */
export interface Fixture<Type extends WebhookEventType> {
	(seed: Seed): Pick<WebhookEventOf<Type>, 'summary' | 'data'>;
}
