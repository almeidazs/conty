import type { Command } from 'commander';

import { connect } from '../../shared/auth';
import { loadConfig, saveConfig } from '../../shared/config';
import { globals, readStdin } from '../../shared/input';
import { print, reportError } from '../../shared/output';
import { interactive, prompts } from '../../shared/prompts';
import { PROFILE_NAME } from '../../types';

export const login = (parent: Command) =>
	parent
		.command('login')
		.description('Salva uma chave de API em um perfil e passa a usá-lo.')
		.option('--name <nome>', 'nome do perfil, sem perguntar')
		.option('--with-key', 'lê a chave de API do stdin (scripts e CI)')
		.option(
			'--webhook-secret <whsec>',
			'segredo do endpoint de webhook, para listen e trigger',
		)
		.option('--force', 'sobrescreve um perfil existente sem perguntar')
		.addHelpText(
			'after',
			'\nExemplos:\n  conty login\n  echo $CONTY_API_KEY | conty login --name loja --with-key',
		)
		.action(async (flags, command: Command) => {
			const options = globals(command);
			const config = await loadConfig();
			const ask = interactive() ? await prompts() : void 0;

			let { name, webhookSecret } = flags as {
				name?: string;
				webhookSecret?: string;
			};
			let key: string;

			if (flags.withKey) {
				if (!name) command.error('error: --with-key precisa de --name');

				key = (await readStdin()).trim();
			} else if (ask) {
				name ??= ask.ok(
					await ask.clack.text({
						message: 'Nome do perfil',
						placeholder: 'minha-marca',
						validate: (value) =>
							PROFILE_NAME.test(value ?? '')
								? void 0
								: 'Use letras, números, ponto, hífen ou sublinhado (até 40).',
					}),
				);
				key = ask
					.ok(
						await ask.clack.password({
							message: 'Chave de API (ck_live_...)',
						}),
					)
					.trim();
				webhookSecret ??=
					ask
						.ok(
							await ask.clack.text({
								message:
									'Segredo do webhook (opcional, Enter pula)',
								placeholder: 'whsec_...',
							}),
						)
						.trim() || void 0;
			} else
				return command.error(
					'error: sem terminal interativo, use --name e --with-key (chave no stdin)',
				);

			if (!PROFILE_NAME.test(name))
				command.error(
					'error: nome de perfil inválido (letras, números, ponto, hífen ou sublinhado, até 40)',
				);

			if (!key) command.error('error: a chave de API está vazia');

			if (webhookSecret && !webhookSecret.startsWith('whsec_'))
				command.error('error: o segredo do webhook começa com whsec_');

			const existing = config.profiles[name];

			if (existing && !flags.force) {
				if (!ask)
					command.error(
						`error: o perfil "${name}" já existe, use --force`,
					);

				if (
					!ask.ok(
						await ask.clack.confirm({
							message: `O perfil "${name}" já existe. Sobrescrever?`,
						}),
					)
				)
					return void console.error('Nada foi alterado.');
			}

			const me = await connect(options, key).me();

			if (!me.ok) {
				console.error(
					'A chave foi recusada pela Conty, nada foi salvo.',
				);

				return reportError(options, me.error);
			}

			config.profiles[name] = {
				key,
				brand: me.data.enterprise.name,
				webhookSecret: webhookSecret || existing?.webhookSecret,
			};
			config.current = name;

			await saveConfig(config);

			print(
				options,
				`Conectado a ${me.data.enterprise.name} no perfil "${name}".`,
			);
		});
