import type { REST, RequestOptions, RESTResult } from '../modules/rest';
import { type ID, type RESTGetMissionResult, Routes } from '../modules/types';

/** Missions of the creators. Read only. */
export class Missions {
	readonly #rest: REST;

	constructor(rest: REST) {
		this.#rest = rest;
	}

	/** Gets a mission with deliveries, content, post, metrics, dates and coupon. */
	get(
		missionId: ID,
		options?: RequestOptions,
	): Promise<RESTResult<RESTGetMissionResult>> {
		return this.#rest.get(Routes.mission(missionId), options);
	}
}
