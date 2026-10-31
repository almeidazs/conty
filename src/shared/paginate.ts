import type { RESTPaginationQuery } from '../modules/types';
import type { PageFetcher, PaginatedPage } from '../types';

/**
 * Walks a cursor paginated list page by page, starting at `query.cursor`.
 * Stops when `has_more` is `false`. A failed page rejects with a `ContyError`.
 */
export async function* pages<
	Query extends RESTPaginationQuery,
	Result extends PaginatedPage,
>(
	query: Query,
	fetchPage: PageFetcher<Query, Result>,
): AsyncGenerator<Result, void, undefined> {
	let cursor = query.cursor;

	while (true) {
		const page = await fetchPage({ ...query, cursor }).unwrap();

		yield page;

		// A cursor that does not move would loop forever.
		if (!(page.has_more && page.next_cursor) || page.next_cursor === cursor)
			return;

		cursor = page.next_cursor;
	}
}

/** Same as `pages`, flattened to the items. */
export async function* items<
	Query extends RESTPaginationQuery,
	Result extends PaginatedPage,
>(
	query: Query,
	fetchPage: PageFetcher<Query, Result>,
): AsyncGenerator<Result['data'][number], void, undefined> {
	for await (const page of pages(query, fetchPage))
		yield* page.data as Result['data'][number][];
}
