import type { Command } from 'commander';

import { mask } from '../../shared/auth';
import { loadConfig } from '../../shared/config';
import { globals } from '../../shared/input';
import { print } from '../../shared/output';

export const profiles = (parent: Command) =>
	parent
		.command('profiles')
		.description('Lista os perfis salvos.')
		.action(async (_flags, command: Command) => {
			const config = await loadConfig();
			const rows = Object.entries(config.profiles).map(
				([name, { brand, key }]) => ({
					current: name === config.current,
					name,
					brand: brand ?? null,
					key: mask(key),
				}),
			);

			print(
				globals(command),
				rows.length > 0
					? { data: rows, has_more: false, next_cursor: null }
					: 'Nenhum perfil salvo. Rode `conty login`.',
				[
					['atual', 'current'],
					['perfil', 'name'],
					['marca', 'brand'],
					['chave', 'key'],
				],
			);
		});
