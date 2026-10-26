/** Query of every list route. */
export type RESTPaginationQuery = {
	/** Items per page, from 1 to 100. @default 20 */
	limit?: number;
	/** `next_cursor` of the previous page. Omit on the first page. */
	cursor?: string;
};
