import { afterAll } from 'bun:test';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const entry = join(import.meta.dir, '../../src/cli/index.ts');

export const KEY = 'ck_live_abcdefgh0MmY';

export const me = {
	enterprise: { id: 'b1', name: 'BeConfident' },
	api_key: { id: 'k1', name: 'Integração loja', hint: '0MmY' },
};

export interface Call {
	method: string;
	path: string;
	params: URLSearchParams;
	headers: Headers;
	body: unknown;
}

const stoppers: (() => void)[] = [];

afterAll(() => {
	for (const stop of stoppers) stop();
});

export const json = (
	body: unknown,
	status = 200,
	headers: Record<string, string> = {},
) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json', ...headers },
	});

export const page = (data: unknown[], next?: string) =>
	json({ data, has_more: Boolean(next), next_cursor: next ?? null });

/** A fake Conty API on a local port, and a way to run the real CLI against it. */
export const setup = async () => {
	const dir = await mkdtemp(join(tmpdir(), 'conty-cli-'));
	const calls: Call[] = [];
	const state: { answer?: (call: Call) => Response | Promise<Response> } = {};

	const server = Bun.serve({
		port: 0,
		fetch: async (request) => {
			const url = new URL(request.url);
			const text = await request.text();
			const call: Call = {
				method: request.method,
				path: url.pathname.replace('/public/v1', ''),
				params: url.searchParams,
				headers: request.headers,
				body: text ? JSON.parse(text) : void 0,
			};

			calls.push(call);

			return (
				(await state.answer?.(call)) ??
				(call.path === '/me' ? json(me) : json({ ok: true }))
			);
		},
	});

	stoppers.push(() => server.stop(true));

	const env = {
		PATH: process.env.PATH ?? '',
		HOME: process.env.HOME ?? dir,
		CONTY_CONFIG_DIR: dir,
		CONTY_BASE_URL: `http://127.0.0.1:${server.port}/public/v1`,
	};

	const spawn = (
		args: string[],
		options: { stdin?: string; env?: Record<string, string> } = {},
	) =>
		Bun.spawn([process.execPath, entry, ...args], {
			env: { ...env, ...options.env },
			stdin:
				options.stdin === void 0 ? 'ignore' : new Blob([options.stdin]),
			stdout: 'pipe',
			stderr: 'pipe',
		});

	/** Runs one command to the end. */
	const cli = async (
		args: string[],
		options: { stdin?: string; env?: Record<string, string> } = {},
	) => {
		const proc = spawn(args, options);
		const [out, err, code] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
			proc.exited,
		]);

		return { code, out, err };
	};

	/** A saved profile, so a test can skip the login. */
	const login = async (name = 'loja', key = KEY) => {
		const result = await cli(['login', '--name', name, '--with-key'], {
			stdin: key,
		});

		if (result.code !== 0) throw new Error(result.err);

		calls.length = 0;
	};

	const config = async () =>
		JSON.parse(await readFile(join(dir, 'config.json'), 'utf8'));

	return { cli, spawn, login, calls, state, config, dir, env };
};

/** Starts a long-running command and waits for the line it prints when it is ready. */
export const start = async (
	harness: Awaited<ReturnType<typeof setup>>,
	args: string[],
	ready: RegExp,
	options: { env?: Record<string, string> } = {},
) => {
	const proc = harness.spawn(args, options);
	const state = { out: '', err: '' };

	const read = async (
		stream: ReadableStream<Uint8Array>,
		key: 'out' | 'err',
	) => {
		for await (const chunk of stream)
			state[key] += new TextDecoder().decode(chunk);
	};

	read(proc.stdout, 'out');
	read(proc.stderr, 'err');

	stoppers.push(() => proc.kill());

	for (let attempt = 0; attempt < 400 && !ready.test(state.err); attempt++)
		await Bun.sleep(10);

	const match = ready.exec(state.err);

	if (!match) throw new Error(`did not start: ${state.err}`);

	return {
		match,
		state,
		stop: async () => {
			proc.kill('SIGINT');

			await proc.exited;
			await Bun.sleep(20);

			return proc.exitCode;
		},
	};
};
