import { readFile } from 'node:fs/promises';

import type { Command } from 'commander';

import { verify as verifySignature } from '../../../modules/webhooks';
import { globals, readStdin } from '../../shared/input';
import { wantsJson } from '../../shared/output';
import { resolveWebhookSecret } from './secret';

export const verify = (parent: Command) =>
	parent
		.command('verify [arquivo]')
		.description(
			'Confere a assinatura de uma entrega (corpo no arquivo ou no stdin).',
		)
		.requiredOption(
			'--signature <valor>',
			'valor do cabeçalho X-Conty-Signature',
		)
		.option(
			'--secret <whsec>',
			'segredo do endpoint; vários, separados por vírgula, na troca de segredo',
		)
		.action(async (file: string | undefined, flags, command: Command) => {
			const options = globals(command);
			const found = await resolveWebhookSecret({
				...options,
				secret: flags.secret,
			});

			if (!found)
				command.error(
					'error: faltou o segredo (--secret, CONTY_WEBHOOK_SECRET ou o salvo no perfil)',
				);

			const secrets = found.secret
				.split(',')
				.map((secret) => secret.trim());
			const valid = await verifySignature({
				body: file ? await readFile(file, 'utf8') : await readStdin(),
				header: flags.signature,
				secret: secrets.length === 1 ? (secrets[0] ?? '') : secrets,
			});

			process.exitCode = valid ? 0 : 1;

			console.log(
				wantsJson(options)
					? JSON.stringify({ valid })
					: valid
						? 'Assinatura válida.'
						: 'Assinatura inválida.',
			);
		});
