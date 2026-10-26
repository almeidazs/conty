/** Waits `ms`, or less if the signal aborts. */
export const sleep = (ms: number, signal?: AbortSignal) =>
	new Promise<void>((resolve) => {
		const done = () => {
			clearTimeout(timer);

			signal?.removeEventListener('abort', done);

			resolve();
		};

		const timer = setTimeout(done, ms);

		if (signal?.aborted) return done();

		signal?.addEventListener('abort', done, { once: true });
	});
