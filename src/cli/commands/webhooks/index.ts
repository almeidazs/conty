import type { Command } from 'commander';

import { listen } from './listen';
import { trigger } from './trigger';
import { verify } from './verify';

export const registerWebhooks = (program: Command) => {
	listen(program);
	trigger(program);
	verify(program.command('webhooks').description('Ferramentas de webhook.'));
};
