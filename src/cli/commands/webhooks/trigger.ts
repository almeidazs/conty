import { Argument, type Command } from 'commander';

import { sign } from '../../../modules/webhooks';
import { collect, globals, readData, toUrl } from '../../shared/input';
import { wantsJson } from '../../shared/output';
import {
	DEFAULT_TRIGGER_URL,
	REQUEST_TIMEOUT,
	SECRET_FLAG,
	UNSAFE_KEYS,
} from '../../types';
import { buildEvent, eventTypes } from './fixtures';
import { resolveWebhookSecret } from './secret';

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const merge = (target: Json, patch: Json): Json => {
	for (const [key, value] of Object.entries(patch)) {
		if (UNSAFE_KEYS.has(key)) continue;

		const current = target[key];

		target[key] =
			isObject(current) && isObject(value)
				? merge(current, value)
				: value;
	}

	return target;
};

/** `data.mission.id=abc` sets that path. The value is JSON when it parses, text otherwise. */
const set = (command: Command, target: Json, assignment: string) => {
	const index = assignment.indexOf('=');
	const path = assignment.slice(0, index).split('.');

	if (index <= 0 || path.some((key) => UNSAFE_KEYS.has(key)))
		command.error(
			`error: --set espera caminho=valor, recebi "${assignment}"`,
		);

	let value: unknown = assignment.slice(index + 1);

	try {
		value = JSON.parse(value as string);
	} catch {}

	let node = target;

	for (const key of path.slice(0, -1))
		node = node[key] = isObject(node[key]) ? (node[key] as Json) : {};

	node[path.at(-1) ?? ''] = value;
};

export const trigger = (program: Command) =>
	program
		.command('trigger')
		.description(
			'Manda à sua URL um evento de webhook assinado, como a Conty mandaria.',
		)
		.addArgument(
			new Argument('<evento>', 'evento a enviar').choices(eventTypes),
		)
		.option(
			'--url <url>',
			'destino (padrão: o `conty listen`)',
			DEFAULT_TRIGGER_URL,
		)
		.option(...SECRET_FLAG)
		.option(
			'--set <caminho=valor>',
			'muda um campo do evento, e.g. data.mission.id=abc (repetível)',
			collect,
			[],
		)
		.option(
			'-d, --data <json|@arquivo|->',
			'JSON parcial, mesclado ao evento',
		)
		.addHelpText(
			'after',
			'\nExemplos:\n  conty trigger application.approved\n  conty trigger mission.video_submitted --set data.submission.resubmission=true\n  conty trigger webhook.test --url http://localhost:3000/webhooks/conty',
		)
		.action(async (type, flags, command: Command) => {
			const options = globals(command);
			const url = toUrl(command, flags.url);
			const event = buildEvent(type) as unknown as Json;
			const patch = await readData(command, flags.data);

			if (patch !== void 0) {
				if (!isObject(patch))
					command.error('error: --data precisa ser um objeto JSON');

				merge(event, patch);
			}

			for (const assignment of flags.set as string[])
				set(command, event, assignment);

			const found = await resolveWebhookSecret(
				{ ...options, secret: flags.secret },
				true,
			);
			const body = JSON.stringify(event);
			const started = Date.now();

			let response: Response;

			try {
				response = await fetch(url, {
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						'user-agent': 'Conty-Webhooks/1.0',
						'x-conty-event': String(event.type),
						'x-conty-event-id': String(event.id),
						'x-conty-delivery': crypto.randomUUID(),
						'x-conty-signature': await sign({
							body,
							secret: found?.secret ?? '',
						}),
					},
					body,
					signal: AbortSignal.timeout(REQUEST_TIMEOUT),
				});
			} catch (error) {
				process.exitCode = 1;

				return console.error(
					`erro: não consegui entregar em ${url} (${error instanceof Error ? error.message : error}). O \`conty listen\` está rodando?`,
				);
			}

			const answer = await response.text();
			const duration = Date.now() - started;

			process.exitCode = response.ok ? 0 : 1;

			if (wantsJson(options))
				return console.log(
					JSON.stringify(
						{
							event: { id: event.id, type: event.type },
							url,
							status: response.status,
							duration_ms: duration,
							body: answer || null,
						},
						null,
						2,
					),
				);

			console.log(
				`${response.ok ? '✔' : '✖'} ${event.type} ${event.id} → ${response.status} (${duration}ms)${answer ? `\n${answer}` : ''}${response.status === 400 ? `\nAssinado com ${found?.secret.slice(0, 10)}…: confira se o listen usa o mesmo segredo (--secret ou a mesma config).` : ''}`,
			);
		});
