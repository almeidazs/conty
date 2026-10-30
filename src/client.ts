import { REST, type RequestOptions } from './modules/rest';
import { type RESTGetMeResult, Routes } from './modules/types';
import { Campaigns, Coupons, Missions } from './resources';
import { respond } from './resources/respond';
import type { ContyOptions, ContyResponse } from './types';

/** Client of the Conty API. */
export class Conty {
	/** HTTP client used for every request. */
	readonly rest: REST;

	/** Coupons per creator, and their sales. */
	readonly coupons: Coupons;

	/** Campaigns and their board. */
	readonly campaigns: Campaigns;

	/** Missions of the creators. */
	readonly missions: Missions;

	/** @param options The API key, or an options object. */
	constructor(options: string | ContyOptions = {}) {
		const { secret, rest } =
			typeof options === 'string' ? { secret: options } : options;

		if (rest instanceof REST) {
			this.rest = secret ? rest.setSecret(secret) : rest;
		} else {
			this.rest = new REST({ ...rest, secret: secret ?? rest?.secret });
		}

		this.coupons = new Coupons(this.rest);
		this.campaigns = new Campaigns(this.rest);
		this.missions = new Missions(this.rest);
	}

	/** Identifies the brand that owns the key. Use it to test the key. */
	me(options?: RequestOptions): ContyResponse<RESTGetMeResult> {
		return respond(this.rest.get(Routes.me(), options));
	}
}
