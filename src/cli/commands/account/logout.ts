import type { Command } from 'commander';

import { loadConfig, saveConfig } from '../../shared/config';
import { globals } from '../../shared/input';
import { print } from '../../shared/output';

export const logout = (parent: Command) =>
	parent
		.command('logout [nome]')
		.description('Remove um perfil salvo (por padrão, o atual).')
		.action(async (given: string | undefined, _flags, command: Command) => {
			const options = globals(command);
			const config = await loadConfig();
			const name = given ?? options.profile ?? config.current;

			if (!name || !config.profiles[name])
				throw new Error(`O perfil "${name}" não existe.`);

			delete config.profiles[name];

			if (config.current === name)
				config.current = Object.keys(config.profiles)[0];

			await saveConfig(config);

			print(
				options,
				`Perfil "${name}" removido.${config.current ? ` Perfil atual: "${config.current}".` : ''}`,
			);
		});
