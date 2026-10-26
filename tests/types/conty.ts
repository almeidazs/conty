import { Conty } from 'contyos';

export const fromSecret = new Conty('secret');
export const fromOptions = new Conty({
	secret: 'secret',
	rest: { retries: 1 },
});
