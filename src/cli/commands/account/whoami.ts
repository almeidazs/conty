import type { Command } from 'commander';

import { connect, mask, resolveAuth } from '../../shared/auth';
import { loadConfig } from '../../shared/config';
import { globals } from '../../shared/input';
import { print, reportError } from '../../shared/output';

export const whoami = (parent: Command) =>
	parent
		.command('whoami')
		.description(
			'Mostra o perfil e a marca da chave em uso, conferindo a chave na Conty.',
		)
		.action(async (_flags, command: Command) => {
			const options = globals(command);
			const config = await loadConfig();
			const auth = await resolveAuth(options, config);
			const me = await connect(options, auth.key).me();

			if (!me.ok) return reportError(options, me.error);

			print(options, {
				profile: auth.profile ?? null,
				source: auth.source,
				brand: me.data.enterprise.name,
				key_name: me.data.api_key.name,
				key: mask(auth.key),
				webhook_secret: Boolean(
					auth.profile &&
					config.profiles[auth.profile]?.webhookSecret,
				),
			});
		});
