import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';

import type { Command } from 'commander';

import { verify } from '../../../modules/webhooks';
import { globals, toUrl } from '../../shared/input';
import { wantsJson } from '../../shared/output';
import {
	DEFAULT_PORT,
	FORWARDED_HEADERS,
	MAX_BODY,
	REQUEST_TIMEOUT,
	SECRET_FLAG,
} from '../../types';
import { resolveWebhookSecret } from './secret';

const readBody = (request: IncomingMessage) =>
	new Promise<string | undefined>((resolve, reject) => {
		const chunks: Buffer[] = [];
		let size = 0;

		request.on('data', (chunk: Buffer) => {
			size += chunk.length;

			if (size > MAX_BODY) {
				resolve(void 0);
				request.destroy();
			} else chunks.push(chunk);
		});
		request.on('end', () =>
			resolve(Buffer.concat(chunks).toString('utf8')),
		);
		request.on('error', reject);
	});

export const listen = (program: Command) =>
	program
		.command('listen')
		.description(
			'Sobe um receptor local de webhooks: verifica, mostra e repassa ao seu app.',
		)
		.option(
			'--port <porta>',
			'porta do receptor (0 escolhe uma livre)',
			(value) => Number.parseInt(value, 10),
			DEFAULT_PORT,
		)
		.option(
			'--forward-to <url>',
			'repassa cada entrega ao seu app, e.g. localhost:3000/webhooks/conty',
		)
		.option(...SECRET_FLAG)
		.addHelpText(
			'after',
			'\nExemplo:\n  conty listen --forward-to localhost:3000/webhooks/conty\n  conty trigger application.approved   # em outro terminal',
		)
		.action(async (flags, command: Command) => {
			if (!(flags.port >= 0 && flags.port <= 65_535))
				command.error('error: --port precisa ser de 0 a 65535');

			const options = globals(command);
			const target = flags.forwardTo
				? toUrl(command, flags.forwardTo)
				: void 0;
			const found = await resolveWebhookSecret(
				{ ...options, secret: flags.secret },
				true,
			);
			const secret = found?.secret ?? '';

			const log = (
				valid: boolean,
				type: string,
				id: string,
				status: number,
				ms?: number,
				event?: unknown,
			) => {
				if (wantsJson(options))
					return console.log(
						JSON.stringify({
							time: new Date().toISOString(),
							type,
							id,
							event,
							valid,
							status,
							forward: target ?? null,
							duration_ms: ms ?? null,
						}),
					);

				const time = new Date().toLocaleTimeString('pt-BR', {
					hour12: false,
				});
				const outcome = !valid
					? `assinatura inválida → 400 (segredo do listen: ${secret.slice(0, 10)}…)`
					: ms === void 0
						? 'recebido'
						: `→ ${status} (${ms}ms)`;

				console.log(
					`${time}  ${valid && status < 400 ? '✔' : '✖'} ${type}  ${id}  ${outcome}${event ? `\n${JSON.stringify(event, null, 2)}\n` : ''}`,
				);
			};

			const server = createServer(async (request, response) => {
				const reply = (
					status: number,
					body = '',
					type = 'text/plain; charset=utf-8',
				) => {
					response.writeHead(status, { 'content-type': type });
					response.end(body);
				};

				try {
					if (request.method !== 'POST')
						return reply(405, 'Use POST.');

					const body = await readBody(request);

					if (body === void 0)
						return reply(413, 'Corpo grande demais.');

					const signature = request.headers['x-conty-signature'];
					const valid = await verify({
						body,
						header: Array.isArray(signature)
							? signature[0]
							: signature,
						secret,
					});

					let type = String(request.headers['x-conty-event'] ?? '?');
					let id = String(request.headers['x-conty-event-id'] ?? '?');
					let event: unknown;

					try {
						event = JSON.parse(body);

						const { type: eventType, id: eventId } = event as {
							type?: string;
							id?: string;
						};

						type = eventType ?? type;
						id = eventId ?? id;
					} catch {}

					if (!valid) {
						log(false, type, id, 400);

						return reply(400, 'Assinatura inválida.');
					}

					if (!target) {
						log(true, type, id, 200, void 0, event);

						return reply(200);
					}

					const started = Date.now();

					try {
						const answer = await fetch(target, {
							method: 'POST',
							headers: Object.fromEntries(
								FORWARDED_HEADERS.flatMap((name) =>
									typeof request.headers[name] === 'string'
										? [
												[
													name,
													request.headers[
														name
													] as string,
												],
											]
										: [],
								),
							),
							body,
							signal: AbortSignal.timeout(REQUEST_TIMEOUT),
						});

						log(
							true,
							type,
							id,
							answer.status,
							Date.now() - started,
							event,
						);

						return reply(
							answer.status,
							await answer.text(),
							answer.headers.get('content-type') ?? void 0,
						);
					} catch (error) {
						const reason =
							error instanceof Error
								? error.message
								: String(error);

						log(true, type, id, 502, Date.now() - started);
						console.error(
							`erro: não consegui repassar para ${target} (${reason})`,
						);

						return reply(502, `Falha ao repassar: ${reason}`);
					}
				} catch {
					reply(500, 'Erro interno.');
				}
			});

			await new Promise<void>((resolve, reject) => {
				server.once('error', () =>
					reject(
						new Error(
							`não consegui abrir a porta ${flags.port}. Ela já está em uso? Use --port <outra>.`,
						),
					),
				);
				server.listen(flags.port, '127.0.0.1', resolve);
			});

			// One line in the terminal; stderr in JSON mode, so stdout stays NDJSON.
			const say = wantsJson(options) ? console.error : console.log;

			say(
				`◆ Conty / Ouvindo em http://127.0.0.1:${(server.address() as AddressInfo).port}${target ? ` → ${target}` : ''}`,
			);

			if (found?.source === 'generated')
				say(`  Segredo gerado e salvo no perfil: ${secret}`);

			await new Promise((resolve) => {
				process.once('SIGINT', resolve);
				process.once('SIGTERM', resolve);
			});

			server.closeAllConnections();
			server.close();
		});
