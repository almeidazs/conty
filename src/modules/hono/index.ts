import { Webhooks as fetch } from '../fetch';
import type { WebhooksOptions } from '../fetch';

export type { WebhooksOptions } from '../fetch';

/** `app.post('/webhooks/conty', Webhooks({ ... }))` */
export const Webhooks = (options: WebhooksOptions) => {
	const handler = fetch(options);

	return ({ req }: { req: { raw: Request } }) => handler(req.raw);
};
