import { Conty } from 'contyos';

export const fromSecret = new Conty('secret');
export const fromOptions = new Conty({
	secret: 'secret',
	rest: { retries: 1 },
});

// The method resolves with a result to narrow...
export const result = async () => {
	const result = await fromSecret.coupons.get('id');

	return result.ok ? result.data.id : result.error.code;
};

// ...and `unwrap()` resolves with the data itself.
export const couponId = async () =>
	(await fromSecret.coupons.get('id').unwrap()).id;
export const brand = async () => (await fromSecret.me().unwrap()).enterprise;
