import type { RESTError, RESTResult } from '../../modules/rest';
import { MAX_CELL } from '../types';
import type { Column, GlobalOptions, ListSource } from '../types';

/** JSON with `--json`, or when stdout is not a terminal. */
export const wantsJson = (options: GlobalOptions) =>
	options.json === true || !process.stdout.isTTY;

const isScalar = (value: unknown) =>
	value === null || ['string', 'number', 'boolean'].includes(typeof value);

const getPath = (value: unknown, path: string) =>
	path
		.split('.')
		.reduce<unknown>(
			(current, key) =>
				current !== null && typeof current === 'object'
					? (current as Record<string, unknown>)[key]
					: void 0,
			value,
		);

const cell = (value: unknown) => {
	if (value === null || value === void 0) return '-';

	const text =
		typeof value === 'object' ? JSON.stringify(value) : String(value);

	return text.length > MAX_CELL ? `${text.slice(0, MAX_CELL - 1)}…` : text;
};

/** Rows as aligned columns. */
export const formatTable = (rows: unknown[], columns: Column[]) => {
	if (rows.length === 0) return 'Nenhum resultado.';

	const cells = rows.map((row) =>
		columns.map(([, path]) => cell(getPath(row, path))),
	);
	const widths = columns.map(([header], index) =>
		Math.max(header.length, ...cells.map((row) => row[index]?.length ?? 0)),
	);
	const line = (values: string[]) =>
		values
			.map((value, index) => value.padEnd(widths[index] ?? 0))
			.join('  ')
			.trimEnd();

	return [
		line(columns.map(([header]) => header.toUpperCase())),
		...cells.map(line),
	].join('\n');
};

/** An object as `key: value` lines, nested ones indented. */
export const formatObject = (value: unknown, indent = 0): string => {
	const pad = ' '.repeat(indent);

	if (isScalar(value)) return `${pad}${cell(value)}`;

	if (Array.isArray(value))
		return value.length === 0
			? `${pad}-`
			: value
					.map((item) =>
						isScalar(item)
							? `${pad}- ${cell(item)}`
							: `${pad}-\n${formatObject(item, indent + 2)}`,
					)
					.join('\n');

	return Object.entries(value as Record<string, unknown>)
		.map(([key, item]) =>
			isScalar(item)
				? `${pad}${key}: ${cell(item)}`
				: `${pad}${key}:\n${formatObject(item, indent + 2)}`,
		)
		.join('\n');
};

interface Page {
	data: unknown[];
	has_more: boolean;
	next_cursor: string | null;
	total?: number;
}

const isPage = (value: unknown): value is Page =>
	typeof value === 'object' &&
	value !== null &&
	Array.isArray((value as Page).data) &&
	'has_more' in value;

/** Prints data as JSON, or as text in a terminal. A page becomes a table. */
export const print = (
	options: GlobalOptions,
	data: unknown,
	columns: Column[] = [],
) => {
	if (data === void 0) return;

	if (wantsJson(options)) return console.log(JSON.stringify(data, null, 2));

	if (typeof data === 'string') return console.log(data);

	if (!isPage(data)) return console.log(formatObject(data));

	const total = data.total === void 0 ? '' : ` de ${data.total}`;
	const more = data.has_more ? ` · mais: --cursor ${data.next_cursor}` : '';

	console.log(
		`${formatTable(data.data, columns)}\n\n${data.data.length}${total} itens${more}`,
	);
};

/** Prints a failure to stderr and sets the exit code to 1. */
export const reportError = (options: GlobalOptions, error: RESTError) => {
	process.exitCode = 1;

	if (wantsJson(options)) {
		const { type, message, status, code, requestId, details, retryAfter } =
			error;

		return console.error(
			JSON.stringify({
				error: {
					type,
					message,
					status,
					code,
					requestId,
					details,
					retryAfter,
				},
			}),
		);
	}

	const extra = [
		error.code,
		error.status && `HTTP ${error.status}`,
		error.requestId && `request_id ${error.requestId}`,
	].filter(Boolean);

	console.error(
		`erro: ${error.message}${extra.length > 0 ? ` (${extra.join(' · ')})` : ''}`,
	);

	for (const detail of error.details ?? [])
		console.error(`  ${JSON.stringify(detail)}`);
};

/** Prints a result, or its error. */
export const printResult = (
	options: GlobalOptions,
	result: RESTResult<unknown>,
	columns?: Column[],
) =>
	result.ok
		? print(options, result.data, columns)
		: reportError(options, result.error);

/** Prints one page, or everything with `--all` (NDJSON with `--json`). */
export const printList = async (
	options: GlobalOptions & { all?: boolean },
	{ page, all, columns }: ListSource,
) => {
	if (!options.all) return printResult(options, await page(), columns);

	const items: unknown[] = [];

	for await (const item of all())
		if (wantsJson(options)) console.log(JSON.stringify(item));
		else items.push(item);

	if (!wantsJson(options)) console.log(formatTable(items, columns));
};
