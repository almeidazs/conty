import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

import type { Config } from '../types';

const { env } = process;

/** `config.json` under `CONTY_CONFIG_DIR`, or `XDG_CONFIG_HOME` (`APPDATA` on Windows). */
const configPath = () => {
	if (env.CONTY_CONFIG_DIR) return join(env.CONTY_CONFIG_DIR, 'config.json');

	const base =
		process.platform === 'win32'
			? (env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'))
			: (env.XDG_CONFIG_HOME ?? join(homedir(), '.config'));

	return join(base, 'conty', 'config.json');
};

/** Reads the saved profiles. A missing file is an empty config. */
export const loadConfig = async (): Promise<Config> => {
	try {
		return {
			profiles: {},
			...JSON.parse(await readFile(configPath(), 'utf8')),
		};
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT')
			return { profiles: {} };

		throw new Error(`Não foi possível ler ${configPath()}.`);
	}
};

/** Writes the config readable only by its owner (0600), replacing the file in one step. */
export const saveConfig = async (config: Config) => {
	const path = configPath();
	const temp = `${path}.${process.pid}.tmp`;

	await mkdir(dirname(path), { recursive: true, mode: 0o700 });
	await writeFile(temp, `${JSON.stringify(config, null, 2)}\n`, {
		mode: 0o600,
	});

	await rename(temp, path);
};
