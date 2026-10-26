/** Options of `verify` and `construct`. */
export interface VerifyOptions {
	/**
	 * Raw body, exactly as it arrived. Never a re-serialized one: any
	 * difference in spaces or key order breaks the signature.
	 */
	body: string | Uint8Array;
	/** Value of the `X-Conty-Signature` header (`t=<unix>,v1=<hex>`). */
	header: string | null | undefined;
	/** Secret of the endpoint (`whsec_...`). Pass `[new, old]` while rotating it. */
	secret: string | string[];
}

/** Options of `sign`. */
export interface SignOptions {
	/** Raw body to sign. */
	body: string | Uint8Array;
	/** Secret of the endpoint. */
	secret: string;
	/** Signature time in Unix seconds. @default now */
	timestamp?: number;
}
