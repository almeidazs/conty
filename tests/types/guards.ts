import {
	Conty,
	ContyError,
	isContyError,
	isCouponExists,
	isRateLimited,
} from 'contyos';

const client = new Conty('secret');

export const fromResult = async (
	body: Parameters<typeof client.coupons.create>[0],
) => {
	const result = await client.coupons.create(body);

	if (isContyError(result, 'coupon_exists')) {
		// `details` is never undefined here, and each item has the coupon id.
		return result.error.details[0]?.coupon_id;
	}

	if (isRateLimited(result)) return result.error.retryAfter;

	if (result.ok) return result.data.id;

	return result.error.message;
};

export const fromCatch = async () => {
	try {
		await client.coupons.get('id').unwrap();
	} catch (error) {
		if (isCouponExists(error)) return error.details[0]?.coupon_id;

		if (isContyError(error)) return error.code;

		if (error instanceof ContyError) return error.type;
	}
};

export const withoutDetails = async () => {
	const result = await client.coupons.get('id');

	if (isContyError(result, 'not_found')) {
		// @ts-expect-error `details` is optional for codes that don't always carry it
		return result.error.details[0];
	}
};
