import type { REST, RequestOptions } from '../modules/rest';
import { type ID, type RESTGetMissionResult, Routes } from '../modules/types';
import type { ContyResponse } from '../types';
import { respond } from './respond';

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
	): ContyResponse<RESTGetMissionResult> {
		return respond(this.#rest.get(Routes.mission(missionId), options));
	}
}
