import { Conty } from '../../client';
import { version } from '../../version';
import type { Auth, Config, GlobalOptions } from '../types';
import { loadConfig } from './config';

/** `ck_live_abcdef1234` becomes `ck_live_…1234`. */
export const mask = (key: string) =>
	`${key.slice(0, key.lastIndexOf('_') + 1)}…${key.slice(-4)}`;

/** `--profile`, then `CONTY_PROFILE`, then `CONTY_API_KEY`, then the current profile. */
export const resolveAuth = async (
	options: GlobalOptions,
	config?: Config,
): Promise<Auth> => {
	const { profiles, current } = config ?? (await loadConfig());

	const name = options.profile ?? process.env.CONTY_PROFILE;

	if (name) {
		const profile = profiles[name];

		if (!profile)
			throw new Error(
				`O perfil "${name}" não existe. Rode \`conty login\`.`,
			);

		return {
			key: profile.key,
			profile: name,
			source: options.profile ? '--profile' : 'CONTY_PROFILE',
		};
	}

	if (process.env.CONTY_API_KEY)
		return { key: process.env.CONTY_API_KEY, source: 'CONTY_API_KEY' };

	const profile = current ? profiles[current] : void 0;

	if (current && profile)
		return { key: profile.key, profile: current, source: 'perfil atual' };

	throw new Error(
		'Você não está autenticado. Rode `conty login` ou defina CONTY_API_KEY.',
	);
};

/** An SDK client for a key, pointed at `--base-url` or `CONTY_BASE_URL`. */
export const connect = (options: GlobalOptions, key: string) =>
	new Conty({
		secret: key,
		rest: {
			baseUrl: options.baseUrl ?? process.env.CONTY_BASE_URL,
			headers: { 'user-agent': `contyos-cli/${version}` },
		},
	});

/** A client for the key in use. */
export const createClient = async (options: GlobalOptions) =>
	connect(options, (await resolveAuth(options)).key);
