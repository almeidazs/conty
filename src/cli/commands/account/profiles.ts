import type { Command } from 'commander';

import { mask } from '../../shared/auth';
import { loadConfig } from '../../shared/config';
import { globals } from '../../shared/input';
import { print, wantsJson } from '../../shared/output';

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

			const options = globals(command);
			// A star marks the current profile in the table; JSON keeps the boolean.
			const shown = wantsJson(options)
				? rows
				: rows.map((row) => ({
						...row,
						current: row.current ? '*' : '',
					}));

			print(
				options,
				rows.length > 0
					? { data: shown, has_more: false, next_cursor: null }
					: 'Nenhum perfil salvo. Rode `conty login`.',
				[
					['atual', 'current'],
					['perfil', 'name'],
					['marca', 'brand'],
					['chave', 'key'],
				],
			);
		});
