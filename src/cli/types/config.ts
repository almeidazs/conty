/** A saved API key. */
export interface Profile {
	/** API key (`ck_live_...`). */
	key: string;
	/** Name of the brand, as `GET /me` returned at login. */
	brand?: string;
	/** Signing secret (`whsec_...`) of the webhook endpoint, for `listen` and `trigger`. */
	webhookSecret?: string;
}

/** Content of `config.json`. */
export interface Config {
	/** Profile used when nothing says otherwise (`conty switch`). */
	current?: string;
	/** Local signing secret, for `listen` and `trigger` when there is no profile. */
	webhookSecret?: string;
	profiles: Record<string, Profile>;
}

/** Where the key in use came from. */
export type AuthSource =
	| '--profile'
	| 'CONTY_PROFILE'
	| 'CONTY_API_KEY'
	| 'perfil atual';

/** The key in use. */
export interface Auth {
	key: string;
	source: AuthSource;
	/** Name of the profile, none for `CONTY_API_KEY`. */
	profile?: string;
}

/** The secret that signs and verifies webhooks, and where it came from. */
export interface WebhookSecret {
	secret: string;
	source: 'flag' | 'env' | 'profile' | 'generated';
}
