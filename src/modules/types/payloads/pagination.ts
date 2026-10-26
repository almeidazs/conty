/** A page of a cursor paginated list, newest first. */
export interface APIPage<T> {
	/** Items of the page. */
	data: T[];
	/** Whether there is a next page. */
	has_more: boolean;
	/** Cursor of the next page, `null` on the last one. Opaque: don't build or change it. */
	next_cursor: string | null;
}
