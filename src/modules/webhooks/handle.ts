import type { VerifyOptions, WebhooksOptions } from './types';
import { construct } from './webhooks';

/** `mission.video_submitted` becomes `onMissionVideoSubmitted`. */
const handlerName = (type: string) =>
	`on${type
		.split(/[._]/)
		.map((part) => part[0]?.toUpperCase() + part.slice(1))
		.join('')}`;

/**
 * What every adapter does: verify and parse the delivery, run the handler of its
 * type (or `onEvent`) and return the HTTP status to answer with: 400 when the
 * delivery isn't valid, 500 when a handler throws (Conty retries), 200 otherwise.
 */
export const handle = async (
	{ secret, onEvent, onError, ...handlers }: WebhooksOptions,
	delivery: Pick<VerifyOptions, 'body' | 'header'>,
): Promise<number> => {
	const event = await construct({ ...delivery, secret });

	if (!event) return 400;

	const run =
		(handlers as Record<string, ((event: unknown) => unknown) | undefined>)[
			handlerName(event.type)
		] ?? onEvent;

	try {
		await run?.(event);
	} catch (error) {
		await onError?.(error, event);

		return 500;
	}

	return 200;
};
