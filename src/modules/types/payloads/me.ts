import type { ID } from '../common';

/** The brand that owns the API key, and the key itself. */
export interface APIMe {
	/** Brand that owns the key. */
	enterprise: {
		/** Id of the brand. */
		id: ID;
		/** Name of the brand. */
		name: string;
	};
	/** Key used in this request. */
	api_key: {
		/** Id of the key. */
		id: ID;
		/** Name given to the key. */
		name: string;
		/** Last 4 characters of the key. */
		hint: string;
	};
}
