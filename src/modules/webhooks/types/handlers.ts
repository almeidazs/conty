import type {
	WebhookEvent,
	WebhookEventOf,
	WebhookEventType,
} from '../../types';
import type { VerifyOptions } from './options';

/** `mission.video_submitted` becomes `MissionVideoSubmitted`. */
export type PascalEventType<Type extends string> =
	Type extends `${infer Head}.${infer Rest}`
		? `${Capitalize<Head>}${PascalEventType<Rest>}`
		: Type extends `${infer Head}_${infer Rest}`
			? `${Capitalize<Head>}${PascalEventType<Rest>}`
			: Capitalize<Type>;

/** One optional `on<Event>` handler per event type, e.g. `onApplicationApproved`. */
export type WebhookHandlers = {
	[Type in WebhookEventType as `on${PascalEventType<Type>}`]?: (
		event: WebhookEventOf<Type>,
	) => unknown;
};

/** Options of the `Webhooks` handler of every framework adapter. */
export interface WebhooksOptions extends WebhookHandlers {
	/** Secret of the endpoint (`whsec_...`). Pass `[new, old]` while rotating it. */
	secret: VerifyOptions['secret'];
	/** Runs for every valid event that has no specific `on<Event>` handler. */
	onEvent?: (event: WebhookEvent) => unknown;
	/** Called when a handler throws. The delivery is answered with 500, so Conty retries it. */
	onError?: (error: unknown, event: WebhookEvent) => unknown;
}
