import { loadConfig, saveConfig } from '../../shared/config';
import type { GlobalOptions, WebhookSecret } from '../../types';

/**
 * `--secret`, then `CONTY_WEBHOOK_SECRET`, then the profile's `whsec_`. With
 * `generate`, a local one is created and saved when none is found.
 */
export const resolveWebhookSecret = async (
	options: GlobalOptions & { secret?: string },
	generate = false,
): Promise<WebhookSecret | undefined> => {
	if (options.secret) return { secret: options.secret, source: 'flag' };

	if (process.env.CONTY_WEBHOOK_SECRET)
		return { secret: process.env.CONTY_WEBHOOK_SECRET, source: 'env' };

	const config = await loadConfig();
	const explicit = options.profile ?? process.env.CONTY_PROFILE;
	const name = explicit ?? config.current;
	const profile = name === void 0 ? void 0 : config.profiles[name];

	if (explicit && !profile)
		throw new Error(`O perfil "${explicit}" não existe.`);

	const saved = (profile ?? config).webhookSecret;

	if (saved) return { secret: saved, source: 'profile' };

	if (!generate) return void 0;

	const bytes = crypto.getRandomValues(new Uint8Array(24));
	const secret = `whsec_${Buffer.from(bytes).toString('hex')}`;

	(profile ?? config).webhookSecret = secret;

	await saveConfig(config);

	return { secret, source: 'generated' };
};
