import type { RESTResult } from '../../modules/rest';

/** Flags of the program, available to every command. */
export interface GlobalOptions {
	json?: boolean;
	profile?: string;
	baseUrl?: string;
}

/** A column of a table: `[header, path]`, the path being dotted (`creator.name`). */
export type Column = [header: string, path: string];

/** A list command: one page, or everything with `--all`. */
export interface ListSource {
	page(): Promise<RESTResult<unknown>>;
	all(): AsyncIterable<unknown>;
	columns: Column[];
}
