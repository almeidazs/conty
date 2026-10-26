import type { ID, ISODateString } from '../common';
import type { APICreatorRef } from './creator';
import type { APIStatusTone } from './mission';

/** Raw status of an application. */
export type APIApplicationStatus =
	| 'pending'
	| 'approved'
	| 'rejected'
	| 'expired';

/** A creator's application to a campaign, as listed in the board. */
export interface APIApplicationItem {
	kind: 'application';
	/** Id of the application. */
	id: ID;
	/** Root campaign: the agreement, or the standalone one. */
	campaign_id: ID;
	/** Creator who applied. */
	creator: APICreatorRef;
	/** Raw status. */
	status: APIApplicationStatus;
	/** Status as the panel shows it. */
	status_label: string;
	/** Color of the status. */
	status_tone: APIStatusTone;
	/** Mission opened by the approval. `null` before approving. */
	mission_id: ID | null;
	/** Amount proposed to the creator, in cents. `null` when money isn't visible. */
	proposed_amount_cents: number | null;
	/** The creator meets the profile the campaign asks for. */
	is_compatible: boolean;
	/** Why the creator is compatible, as the panel shows. */
	match_tags: string[];
	/** When the application was created. */
	created_at: ISODateString;
}
