import type { Command } from 'commander';

import { loadConfig, saveConfig } from '../../shared/config';
import { globals } from '../../shared/input';
import { print } from '../../shared/output';
import { interactive, prompts } from '../../shared/prompts';

export const switchProfile = (parent: Command) =>
	parent
		.command('switch [nome]')
		.description('Troca o perfil atual.')
		.action(async (given: string | undefined, _flags, command: Command) => {
			const config = await loadConfig();
			const names = Object.keys(config.profiles);

			let name = given;

			if (!name && interactive() && names.length > 0) {
				const { clack, ok } = await prompts();

				name = ok(
					await clack.select({
						message: 'Perfil',
						options: names.map((value) => ({
							value,
							label: value,
							hint: config.profiles[value]?.brand,
						})),
					}),
				);
			}

			if (!name) return command.error('error: diga o nome do perfil');

			if (!config.profiles[name])
				throw new Error(
					`O perfil "${name}" não existe (perfis: ${names.join(', ') || 'nenhum'}).`,
				);

			config.current = name;

			await saveConfig(config);

			print(globals(command), `Agora usando "${name}".`);
		});
