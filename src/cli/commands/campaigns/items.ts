import type { Command } from 'commander';

import type { RESTGetCampaignItemsQuery } from '../../../modules/types';
import { createClient } from '../../shared/auth';
import { globals, toFields, toNumber, withPaging } from '../../shared/input';
import { printList } from '../../shared/output';
import { ITEM_COLUMNS } from '../../types';

export const items = (parent: Command) =>
	withPaging(
		parent
			.command('items <id>')
			.description(
				'Lista as missões ou candidaturas de uma etapa do quadro.',
			),
	)
		.requiredOption(
			'--stage <etapa>',
			'etapa a listar, um id de `campaigns stages`',
		)
		.option('--q <texto>', 'busca de creator: nome, @instagram ou @tiktok')
		.option(
			'--sort <campo>',
			'ordenação, uma das `sorts` da etapa (match, views...)',
		)
		.option('--order <asc|desc>', 'direção da ordenação')
		.option('--only-compatible', 'só as candidaturas compatíveis')
		.option('--no-only-compatible', 'inclui as incompatíveis')
		.option('--gender <gênero>', 'feminino, masculino ou nao_binario')
		.option('--state <UF>', 'estado do creator')
		.option('--city <cidades>', 'cidades, separadas por vírgula')
		.option(
			'--location <locais>',
			'locais como país:UF:cidade, separados por vírgula',
		)
		.option('--networks <redes>', 'redes conectadas, separadas por vírgula')
		.option(
			'--followers-min <n>',
			'mínimo de seguidores no Instagram',
			toNumber,
		)
		.option(
			'--followers-max <n>',
			'máximo de seguidores no Instagram',
			toNumber,
		)
		.option('--scope-option-id <id>', 'só creators desta opção de escopo')
		.option('--briefing-id <id>', 'só creators com este briefing')
		.option(
			'--exclude-in-other-campaigns',
			'tira quem está em outra campanha ativa',
		)
		.option(
			'--no-exclude-in-other-campaigns',
			'mantém quem está em outra campanha ativa',
		)
		.option(
			'--elsewhere-status <status>',
			'participating, rejected ou approved',
		)
		.option('--elsewhere-mode <modo>', 'include ou exclude')
		.option(
			'--elsewhere-campaigns <ids>',
			'campanhas do filtro elsewhere, separadas por vírgula',
		)
		.option(
			'--elsewhere-min <n>',
			'em quantas dessas campanhas, no mínimo (1 a 3)',
			toNumber,
		)
		.action(async (id: string, { all, ...flags }, command: Command) => {
			const options = globals(command);
			const client = await createClient(options);
			const query = toFields(flags) as RESTGetCampaignItemsQuery;

			await printList(
				{ ...options, all },
				{
					page: () => client.campaigns.items(id, query),
					all: () => client.campaigns.iterateItems(id, query),
					columns: ITEM_COLUMNS,
				},
			);
		});
