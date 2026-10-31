import type { REST, RequestOptions } from '../modules/rest';
import {
	type ID,
	type RESTGetCampaignItemsQuery,
	type RESTGetCampaignItemsResult,
	type RESTGetCampaignResult,
	type RESTGetCampaignsQuery,
	type RESTGetCampaignsResult,
	type RESTGetCampaignStagesQuery,
	type RESTGetCampaignStagesResult,
	Routes,
} from '../modules/types';
import type { ContyResponse } from '../types';
import { respond } from './respond';

/** Campaigns (agreements and standalone ones) and their board. Read only. */
export class Campaigns {
	private readonly rest: REST;

	constructor(rest: REST) {
		this.rest = rest;
	}

	/** Lists the brand's campaigns, newest first. */
	list(
		query?: RESTGetCampaignsQuery,
		options?: RequestOptions,
	): ContyResponse<RESTGetCampaignsResult> {
		return respond(
			this.rest.get(Routes.campaigns(), { ...options, query }),
		);
	}

	/** Gets a campaign with blocks, requirements and review chain. */
	get(
		campaignId: ID,
		options?: RequestOptions,
	): ContyResponse<RESTGetCampaignResult> {
		return respond(this.rest.get(Routes.campaign(campaignId), options));
	}

	/** Gets the stages of the board, with counts, sorts and filters of each. */
	stages(
		campaignId: ID,
		query?: RESTGetCampaignStagesQuery,
		options?: RequestOptions,
	): ContyResponse<RESTGetCampaignStagesResult> {
		return respond(
			this.rest.get(Routes.campaignStages(campaignId), {
				...options,
				query,
			}),
		);
	}

	/** Lists the missions or applications of a stage of the board. */
	items(
		campaignId: ID,
		query: RESTGetCampaignItemsQuery,
		options?: RequestOptions,
	): ContyResponse<RESTGetCampaignItemsResult> {
		return respond(
			this.rest.get(Routes.campaignItems(campaignId), {
				...options,
				query,
			}),
		);
	}
}
