export const interactive = () =>
	Boolean(process.stdin.isTTY && process.stdout.isTTY);

/** @clack/prompts, loaded only when a question is asked. A cancelled one ends the command. */
export const prompts = async () => {
	const clack = await import('@clack/prompts');

	return {
		clack,
		ok: <T>(value: T) => {
			if (clack.isCancel(value)) throw new Error('Cancelado.');

			return value as Exclude<T, symbol>;
		},
	};
};
