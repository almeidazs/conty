import { Argument, type Command, InvalidArgumentError } from 'commander';

import type { HTTPMethod } from '../../../modules/rest';
import { createClient } from '../../shared/auth';
import { collect, globals, readData } from '../../shared/input';
import { reportError } from '../../shared/output';
import { HTTP_METHODS } from '../../types';

const API = 'https://api.appconty.com/public/v1';

const pair = (command: Command, value: string, separator: string) => {
	const index = value.indexOf(separator);

	if (index <= 0)
		command.error(
			`error: esperava ${separator === '=' ? 'chave=valor' : 'Nome: valor'}, recebi "${value}"`,
		);

	return [
		value.slice(0, index).trim(),
		value.slice(index + 1).trim(),
	] as const;
};

export const api = (program: Command) =>
	program
		.command('api')
		.description(
			'Chamada crua na API, com a chave em uso. Sai com 1 se não for 2xx.',
		)
		.addArgument(
			new Argument('<método>', HTTP_METHODS.join(', ')).argParser(
				(value) => {
					if (!HTTP_METHODS.includes(value.toUpperCase()))
						throw new InvalidArgumentError(
							`use ${HTTP_METHODS.join(', ')}.`,
						);

					return value.toUpperCase();
				},
			),
		)
		.argument('<rota>', 'e.g. /coupons, ou a URL completa da API')
		.option('-d, --data <json|@arquivo|->', 'corpo da requisição')
		.option(
			'-q, --query <chave=valor>',
			'parâmetro da query (repetível)',
			collect,
			[],
		)
		.option(
			'-H, --header <Nome: valor>',
			'cabeçalho extra (repetível)',
			collect,
			[],
		)
		.option('-i, --include', 'mostra o status e os cabeçalhos da resposta')
		.addHelpText(
			'after',
			'\nExemplos:\n  conty api GET /coupons -q limit=5\n  conty api POST /coupons -d \'{"code":"FULANA10","mission_id":"<id>"}\'',
		)
		.action(
			async (
				method: HTTPMethod,
				route: string,
				flags,
				command: Command,
			) => {
				const options = globals(command);
				const base = (
					options.baseUrl ??
					process.env.CONTY_BASE_URL ??
					API
				).replace(/\/+$/, '');

				// The key goes only to the API in use, never to another host.
				if (/^https?:\/\//i.test(route)) {
					const rest = route.startsWith(base)
						? route.slice(base.length)
						: void 0;

					if (rest === void 0 || !/^([/?]|$)/.test(rest))
						command.error(
							`error: a URL precisa começar com ${base}`,
						);

					route = rest;
				}

				const [path = '', search = ''] = route.split('?');
				const query = new URLSearchParams(search);

				for (const item of flags.query as string[])
					query.append(...pair(command, item, '='));

				const client = await createClient(options);
				const result = await client.rest.request({
					method,
					route: path,
					query: Object.fromEntries(
						[...new Set(query.keys())].map((key) => [
							key,
							query.getAll(key),
						]),
					),
					headers: Object.fromEntries(
						(flags.header as string[]).map((item) =>
							pair(command, item, ':'),
						),
					),
					body: await readData(command, flags.data),
				});

				if (flags.include && result.headers)
					console.log(
						[
							`HTTP ${result.status ?? '-'}`,
							...[...result.headers].map(
								([name, value]) => `${name}: ${value}`,
							),
							'',
						].join('\n'),
					);

				if (result.ok)
					return console.log(
						typeof result.data === 'string'
							? result.data
							: JSON.stringify(result.data, null, 2),
					);

				// Like curl: the body goes to stdout even on an error, the summary to stderr.
				if (result.error.body !== void 0)
					console.log(JSON.stringify(result.error.body, null, 2));

				reportError(options, result.error);
			},
		);
