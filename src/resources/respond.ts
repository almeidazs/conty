import { type RESTResult, unwrap } from '../modules/rest';
import type { ContyResponse } from '../types';

/** Adds `unwrap()` to the promise of a request. The promise itself still never rejects. */
export const respond = <T>(request: Promise<RESTResult<T>>): ContyResponse<T> =>
	Object.assign(request, { unwrap: () => request.then(unwrap) });
