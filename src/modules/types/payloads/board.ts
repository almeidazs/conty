import type { APIApplicationItem } from './application';
import type { APIMissionItem } from './mission';

/** Id of a stage of the board, as `/stages` returns it. */
export type APIBoardStageId =
	| 'interested'
	| 'preApproved'
	| 'declinedByBrand'
	| 'awaitingBriefing'
	| 'invited'
	| 'assetReview'
	| 'inProgress'
	| 'submitted'
	| 'requestedChanges'
	| 'approved'
	| 'refused'
	| 'expired'
	| 'excluded'
	| 'curationApproved'
	| 'curationRejected'
	| 'curationExpired'
	| 'overview'
	| 'script.awaiting'
	| 'script.internal'
	| 'script.brand'
	| 'script.changeRequest'
	| 'script.adjusting'
	| 'script.approved'
	| 'content.awaiting'
	| 'content.internal'
	| 'content.brand'
	| 'content.changeRequest'
	| 'content.adjusting'
	| 'content.approved';

/** Group of stages in the board. */
export type APIBoardStageGroupId =
	| 'curation'
	| 'deliveries'
	| 'overview'
	| 'results'
	| 'progress';

/** What a stage lists. */
export type APIBoardStageKind = 'missions' | 'applications';

/** What a stage's `count` counts. `creators` counts distinct people, each with all their deliveries in the items. */
export type APIBoardStageUnit = 'missions' | 'creators' | 'applications';

/** Sorts accepted by stages that list applications. */
export type APIApplicationSort =
	| 'match'
	| 'rating'
	| 'followers'
	| 'recent'
	| 'oldest';

/** Sorts accepted by stages that list missions. */
export type APIMissionSort =
	| 'recent'
	| 'deadline'
	| 'started'
	| 'followers'
	| 'name'
	| 'rating'
	| 'views'
	| 'engagement';

/**
 * Groups of filters a stage offers: `followers` (`followers_min` and
 * `followers_max`), `sort` (`sort` and `order`), `compatible`
 * (`only_compatible`) and `elsewhere` (`elsewhere_*`).
 */
export type APIBoardStageFilter =
	| 'followers'
	| 'sort'
	| 'compatible'
	| 'elsewhere';

/** A sort a stage accepts. */
export interface APIBoardStageSort {
	/** Value to send in `sort` for this stage's items. */
	value: string;
	/** Label of the sort in the panel. */
	label: string;
}

/** A stage of the board. */
export interface APIBoardStage {
	/** Id of the stage. */
	id: APIBoardStageId;
	/** Group of the stage. */
	group: APIBoardStageGroupId;
	/** Label of the stage in the panel. */
	label: string;
	/** What the stage lists: missions or applications. */
	kind: APIBoardStageKind;
	/** What `count` counts. */
	unit: APIBoardStageUnit;
	/** Quantity in the stage, the same as the panel, filtered by `q`. */
	count: number;
	/** Outcome stage: what is here doesn't move anymore. */
	closed: boolean;
	/** Sorts accepted in the items of this stage. */
	sorts: APIBoardStageSort[];
	/** Groups of filters the stage offers. */
	filters: APIBoardStageFilter[];
}

/** A group of stages. */
export interface APIBoardStageGroup {
	/** Id of the group. */
	id: APIBoardStageGroupId;
	/** Label of the group. */
	label: string;
	/** Total of the group, when the panel shows one. */
	count: number | null;
}

/** Vacancies of the campaign. */
export interface APIBoardVacancies {
	/** Filled vacancies. */
	filled: number;
	/** Total vacancies. `null` when there is no cap. */
	total: number | null;
	/** Open vacancies. `null` when there is no cap. */
	open: number | null;
	/** Creators waiting for a vacancy. */
	waiting: number;
	/** What limits the vacancies: the creators cap or the budget. */
	limited_by: 'creators_limit' | 'budget' | null;
	/** Summary of the vacancies, as the panel shows. */
	label: string;
}

/** Stages, groups and vacancies of a campaign's board. */
export interface APIBoardStages {
	/** Stages the key can see, in the panel's order. */
	stages: APIBoardStage[];
	/** Groups of stages. */
	groups: APIBoardStageGroup[];
	/** Vacancies of the campaign. */
	vacancies: APIBoardVacancies;
}

/** An item of the board: a mission or an application, by `kind`. */
export type APIBoardItem = APIMissionItem | APIApplicationItem;

/** A page of the items of a stage. */
export interface APIBoardItemList {
	/** Items of the page. */
	data: APIBoardItem[];
	/** Whether there is a next page. */
	has_more: boolean;
	/**
	 * Cursor of the next page, `null` on the last one. Only valid with the
	 * same stage, filters and sort.
	 */
	next_cursor: string | null;
	/** Total of the stage with the filters applied, in the stage's unit. */
	total: number;
	/** Applications compatible with the filters applied. `null` outside application stages. */
	compatible_count: number | null;
}
