import type { ContyResponse } from './response';

/** The shape every cursor paginated response shares. */
export interface PaginatedPage {
	data: unknown[];
	has_more: boolean;
	next_cursor: string | null;
}

/** Fetches the page of a query. */
export interface PageFetcher<Query, Result> {
	(query: Query): ContyResponse<Result>;
}
