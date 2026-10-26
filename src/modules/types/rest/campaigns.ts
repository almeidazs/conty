import type { ID } from '../common';
import type {
	APIApplicationSort,
	APIBoardItemList,
	APIBoardStageId,
	APIBoardStages,
	APICampaign,
	APICampaignDetail,
	APIMissionSort,
	APIPage,
} from '../payloads';
import type { RESTPaginationQuery } from './pagination';

/** `GET /campaigns` */
export type RESTGetCampaignsQuery = RESTPaginationQuery & {
	/**
	 * One or more statuses separated by comma (`approved,paused`). Without it,
	 * archived campaigns are left out; `archived` lists only them and doesn't
	 * combine with other statuses.
	 */
	status?: string;
	/** Search by campaign name (1 to 80 characters). */
	q?: string;
};

/** `GET /campaigns` */
export type RESTGetCampaignsResult = APIPage<APICampaign>;

/** `GET /campaigns/{id}` */
export type RESTGetCampaignResult = APICampaignDetail;

/** `GET /campaigns/{id}/stages` */
export type RESTGetCampaignStagesQuery = {
	/** Creator search (name, @instagram, @tiktok). The counts only include who matches. */
	q?: string;
};

/** `GET /campaigns/{id}/stages` */
export type RESTGetCampaignStagesResult = APIBoardStages;

/** `GET /campaigns/{id}/items` */
export type RESTGetCampaignItemsQuery = RESTPaginationQuery & {
	/** Stage to list, an id returned by `/stages`. */
	stage: APIBoardStageId;
	/** Creator search: name, @instagram or @tiktok. */
	q?: string;
	/** Sort, one of the stage's `sorts`. `match` sorts by compatibility. */
	sort?: APIApplicationSort | APIMissionSort;
	/** Direction of the sort. */
	order?: 'asc' | 'desc';
	/** `true` lists only applications compatible with the campaign. */
	only_compatible?: boolean;
	/** Gender of the creator. */
	gender?: 'feminino' | 'masculino' | 'nao_binario';
	/** State (UF) of the creator. */
	state?: string;
	/** Cities of the creator, separated by comma. */
	city?: string | string[];
	/** Locations as `country:UF:city`, separated by comma. UF and city are optional. */
	location?: string | string[];
	/** Networks the creator has connected, separated by comma. */
	networks?: string | string[];
	/** Minimum followers on Instagram. */
	followers_min?: number;
	/** Maximum followers on Instagram. At least `followers_min`. */
	followers_max?: number;
	/** Only creators of this scope option of the agreement. */
	scope_option_id?: ID;
	/** Only creators with this briefing of the agreement. */
	briefing_id?: ID;
	/** `true` leaves out who is in another active campaign of the brand. */
	exclude_in_other_campaigns?: boolean;
	/** Status of the creator in the brand's other campaigns, for the `elsewhere` filter. */
	elsewhere_status?: 'participating' | 'rejected' | 'approved';
	/** `include` keeps only who matches the `elsewhere` filter, `exclude` removes it. */
	elsewhere_mode?: 'include' | 'exclude';
	/** Campaigns considered in the `elsewhere` filter, separated by comma. */
	elsewhere_campaigns?: string | string[];
	/** In how many of those campaigns, at least, the creator must be (1 to 3). */
	elsewhere_min?: number;
};

/** `GET /campaigns/{id}/items` */
export type RESTGetCampaignItemsResult = APIBoardItemList;
