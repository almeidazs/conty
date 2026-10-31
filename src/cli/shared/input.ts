import { readFile } from 'node:fs/promises';

import { type Command, InvalidArgumentError } from 'commander';

import type { GlobalOptions } from '../types';

/** For `.option('--limit <n>', desc, toNumber)`. */
export const toNumber = (value: string) => {
	const number = Number(value);

	if (value.trim() === '' || Number.isNaN(number))
		throw new InvalidArgumentError('precisa ser um número.');

	return number;
};

/** For a repeatable option: `.option('-q <k=v>', desc, collect, [])`. */
export const collect = (value: string, previous: string[]) => [
	...previous,
	value,
];

export const readStdin = async () => {
	const chunks: Buffer[] = [];

	for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));

	return Buffer.concat(chunks).toString('utf8');
};

/** `--campaign-id` (`campaignId` in commander) becomes `campaign_id`, without the empty ones. */
export const toFields = (options: Record<string, unknown>) =>
	Object.fromEntries(
		Object.entries(options)
			.filter(([, value]) => value !== void 0)
			.map(([key, value]) => [
				key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
				value,
			]),
	);

/** Reads `--data`: inline JSON, `@file` or `-` for stdin. */
export const readData = async (
	command: Command,
	data?: string,
): Promise<unknown> => {
	if (data === void 0) return void 0;

	try {
		const text =
			data === '-'
				? await readStdin()
				: data.startsWith('@')
					? await readFile(data.slice(1), 'utf8')
					: data;

		return JSON.parse(text);
	} catch {
		return command.error(
			'error: --data não é um JSON válido (ou o arquivo não pôde ser lido)',
		);
	}
};

/** `--data` merged with the flags, which win. Fails when a field in `required` is missing. */
export const readBody = async (
	command: Command,
	options: { data?: string },
	required: string[] = [],
) => {
	const { data, ...flags } = options;
	const json = await readData(command, data);

	if (
		json !== void 0 &&
		(json === null || typeof json !== 'object' || Array.isArray(json))
	)
		command.error('error: --data precisa ser um objeto JSON');

	const body: Record<string, unknown> = {
		...(json as object),
		...toFields(flags),
	};
	const missing = required.filter((field) => body[field] === void 0);

	if (missing.length > 0)
		command.error(
			`error: faltou ${missing.map((field) => `--${field.replaceAll('_', '-')}`).join(', ')}`,
		);

	return body;
};

/** The global flags (`--json`, `--profile`, `--base-url`), wherever the command is. */
export const globals = (command: Command) =>
	command.optsWithGlobals<GlobalOptions>();

/** `--limit`, `--cursor` and `--all` of the list commands. */
export const withPaging = (command: Command) =>
	command
		.option('--limit <n>', 'itens por página, de 1 a 100', toNumber)
		.option('--cursor <cursor>', 'continua do next_cursor de uma página')
		.option('--all', 'percorre todas as páginas (NDJSON com --json)');

/** `:3000/hook` and `localhost:3000/hook` become full URLs. */
export const toUrl = (command: Command, value: string) => {
	try {
		return new URL(
			/^https?:\/\//i.test(value)
				? value
				: `http://${value.startsWith(':') ? `127.0.0.1${value}` : value}`,
		).toString();
	} catch {
		return command.error(`error: URL inválida: ${value}`);
	}
};
