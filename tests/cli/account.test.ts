import { describe, expect, test } from 'bun:test';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';

import { json, KEY, setup } from './helpers';

const invalid = () =>
	json(
		{
			error: {
				code: 'invalid_api_key',
				message: 'Chave inválida.',
				request_id: 'r1',
			},
		},
		401,
	);

describe('login', () => {
	test('saves the profile after checking the key, readable only by the owner', async () => {
		const h = await setup();
		const result = await h.cli(['login', '--name', 'loja', '--with-key'], {
			stdin: `${KEY}\n`,
		});

		expect(result.code).toBe(0);
		expect(result.out).toContain('BeConfident');
		expect(h.calls[0]?.path).toBe('/me');
		expect(h.calls[0]?.headers.get('authorization')).toBe(`Bearer ${KEY}`);

		const config = await h.config();

		expect(config.current).toBe('loja');
		expect(config.profiles.loja).toMatchObject({
			key: KEY,
			brand: 'BeConfident',
		});

		if (process.platform !== 'win32')
			expect((await stat(join(h.dir, 'config.json'))).mode & 0o777).toBe(
				0o600,
			);
	});

	test('refuses a key Conty rejects and saves nothing', async () => {
		const h = await setup();

		h.state.answer = invalid;

		const result = await h.cli(['login', '--name', 'loja', '--with-key'], {
			stdin: 'ck_live_nope',
		});

		expect(result.code).toBe(1);
		expect(result.err).toContain('recusada');
		expect(result.err).toContain('invalid_api_key');
		expect((await h.cli(['profiles'])).out).toContain('Nenhum perfil');
	});

	test('is a usage error without a name, a key, a valid name, or --force', async () => {
		const h = await setup();

		expect((await h.cli(['login'])).code).toBe(2);
		expect(
			(await h.cli(['login', '--with-key'], { stdin: KEY })).code,
		).toBe(2);
		expect(
			(
				await h.cli(['login', '--name', 'a b', '--with-key'], {
					stdin: KEY,
				})
			).code,
		).toBe(2);
		expect(
			(await h.cli(['login', '--name', 'a', '--with-key'], { stdin: '' }))
				.code,
		).toBe(2);
		expect(h.calls).toHaveLength(0);

		await h.login();

		expect(
			(
				await h.cli(['login', '--name', 'loja', '--with-key'], {
					stdin: KEY,
				})
			).code,
		).toBe(2);
		expect(
			(
				await h.cli(
					['login', '--name', 'loja', '--with-key', '--force'],
					{ stdin: KEY },
				)
			).code,
		).toBe(0);
	});
});

describe('profiles', () => {
	test('whoami, profiles, switch and logout', async () => {
		const h = await setup();

		await h.login('loja', KEY);
		await h.login('agencia', 'ck_live_zzzzzzzz9999');

		const whoami = JSON.parse((await h.cli(['whoami'])).out);

		expect(whoami).toMatchObject({
			profile: 'agencia',
			source: 'perfil atual',
			key: 'ck_live_…9999',
		});
		expect((await h.cli(['whoami'])).out).not.toContain('zzzzzzzz');

		const profiles = JSON.parse((await h.cli(['profiles'])).out).data;

		expect(
			profiles.map((profile: { name: string }) => profile.name),
		).toEqual(['loja', 'agencia']);

		expect((await h.cli(['switch', 'loja'])).code).toBe(0);
		expect(JSON.parse((await h.cli(['whoami'])).out).profile).toBe('loja');
		expect((await h.cli(['switch', 'nada'])).code).toBe(1);
		expect((await h.cli(['switch'])).code).toBe(2);

		expect((await h.cli(['logout', 'loja'])).code).toBe(0);
		expect((await h.config()).current).toBe('agencia');

		await h.cli(['logout']);

		expect((await h.cli(['whoami'])).code).toBe(1);
		expect((await h.cli(['logout', 'nada'])).code).toBe(1);
	});

	test('whoami asks Conty, so an invalid key is an error', async () => {
		const h = await setup();

		await h.login();

		expect(JSON.parse((await h.cli(['whoami'])).out)).toMatchObject({
			brand: 'BeConfident',
			key_name: 'Integração loja',
			key: 'ck_live_…0MmY',
		});

		h.state.answer = invalid;

		const result = await h.cli(['whoami'], {
			env: { CONTY_API_KEY: 'pica' },
		});

		expect(result.code).toBe(1);
		expect(result.err).toContain('invalid_api_key');
		expect(result.out).toBe('');
	});
});

describe('which key is used', () => {
	const authorization = async (
		env: Record<string, string>,
		...flags: string[]
	) => {
		const h = await setup();

		await h.login('a', 'ck_live_aaaaaaaa1111');
		await h.login('b', 'ck_live_bbbbbbbb2222');
		await h.cli(['switch', 'a']);

		const result = await h.cli([...flags, 'whoami'], { env });

		return {
			code: result.code,
			err: result.err,
			header: h.calls[0]?.headers.get('authorization'),
		};
	};

	test('the current profile by default', async () => {
		expect((await authorization({})).header).toBe(
			'Bearer ck_live_aaaaaaaa1111',
		);
	});

	test('CONTY_API_KEY beats the current profile', async () => {
		expect(
			(await authorization({ CONTY_API_KEY: 'ck_live_envenv' })).header,
		).toBe('Bearer ck_live_envenv');
	});

	test('--profile and CONTY_PROFILE beat CONTY_API_KEY', async () => {
		const env = { CONTY_API_KEY: 'ck_live_envenv' };

		expect((await authorization(env, '--profile', 'b')).header).toBe(
			'Bearer ck_live_bbbbbbbb2222',
		);
		expect(
			(await authorization({ ...env, CONTY_PROFILE: 'b' })).header,
		).toBe('Bearer ck_live_bbbbbbbb2222');
	});

	test('an unknown profile is an error, not a fallback', async () => {
		const result = await authorization(
			{ CONTY_API_KEY: 'x' },
			'--profile',
			'nada',
		);

		expect(result.code).toBe(1);
		expect(result.err).toContain('"nada" não existe');
		expect(result.header).toBeUndefined();
	});

	test('no key at all asks for a login, and whoami says where the key came from', async () => {
		const h = await setup();
		const result = await h.cli(['whoami']);

		expect(result.code).toBe(1);
		expect(result.err).toContain('conty login');
		expect(
			JSON.parse(
				(await h.cli(['whoami'], { env: { CONTY_API_KEY: KEY } })).out,
			),
		).toMatchObject({
			profile: null,
			source: 'CONTY_API_KEY',
			key: 'ck_live_…0MmY',
		});
	});
});

test('--base-url points the CLI elsewhere', async () => {
	const h = await setup();

	await h.login();

	const other = await setup();
	const result = await h.cli([
		'whoami',
		'--base-url',
		`http://127.0.0.1:${new URL(other.env.CONTY_BASE_URL).port}/public/v1`,
	]);

	expect(result.code).toBe(0);
	expect(other.calls).toHaveLength(1);
	expect(h.calls).toHaveLength(0);
});
