#!/usr/bin/env node
import { Command, CommanderError } from 'commander';

import { ContyError } from '../modules/rest';
import { version } from '../version';
import { registerAccount } from './commands/account';
import { api } from './commands/api/api';
import { registerCampaigns } from './commands/campaigns';
import { registerCoupons } from './commands/coupons';
import { registerMissions } from './commands/missions';
import { registerWebhooks } from './commands/webhooks';
import { reportError } from './shared/output';

const program = new Command('conty')
	.description('CLI não oficial da Conty.')
	.version(version, '-v, --version', 'mostra a versão')
	.helpOption('-h, --help', 'mostra a ajuda')
	.option(
		'--json',
		'imprime JSON puro (padrão quando a saída não é um terminal)',
	)
	.option('-p, --profile <nome>', 'usa este perfil em vez do atual')
	.option('--base-url <url>', 'aponta para outra API (ou CONTY_BASE_URL)')
	.configureHelp({ showGlobalOptions: true })
	.exitOverride();

registerAccount(program);
registerCoupons(program);
registerCampaigns(program);
registerMissions(program);
api(program);
registerWebhooks(program);

try {
	await program.parseAsync();
} catch (error) {
	if (error instanceof CommanderError)
		// Commander already printed it: 0 for --help and --version, 2 for wrong usage.
		process.exitCode = error.exitCode === 0 ? 0 : 2;
	else if (error instanceof ContyError) reportError(program.opts(), error);
	else {
		console.error(
			`erro: ${error instanceof Error ? error.message : error}`,
		);

		process.exitCode = 1;
	}
}
