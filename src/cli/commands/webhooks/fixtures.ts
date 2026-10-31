import type {
	WebhookEvent,
	WebhookEventType,
	WebhookMission,
} from '../../../modules/types';
import type { Fixture, Seed } from '../../types';

const seed = (): Seed => {
	const campaign = crypto.randomUUID();

	return {
		brand: { id: crypto.randomUUID(), name: 'Marca Exemplo' },
		campaign: {
			id: campaign,
			name: 'Campanha de Exemplo',
			url: `https://appconty.com/campaigns/${campaign}`,
		},
		creator: {
			id: crypto.randomUUID(),
			name: 'Fulana Souza',
			handle: '@fulana',
		},
		application: { id: crypto.randomUUID(), status: 'approved' },
		mission: {
			id: crypto.randomUUID(),
			status: 'fazendo',
			platform: 'instagram',
		},
	};
};

const common = ({ brand, campaign, creator }: Seed) => ({
	brand,
	campaign,
	creator,
});

const line = (s: Seed, action: string) =>
	`${s.brand.name}: ${s.creator.name} ${action} da campanha "${s.campaign.name}".`;

const mission = (s: Seed, status: WebhookMission['status']) => ({
	...common(s),
	mission: { ...s.mission, status },
});

const submitted = (
	s: Seed,
	items: ('script' | 'video' | 'cover' | 'caption')[],
) => ({
	...mission(s, 'em_analise'),
	submission: { items, resubmission: false },
});

/**
 * One example per event. `satisfies` makes this fail to compile when an event
 * is added to `contyos/types` without one here.
 */
const fixtures = {
	'application.created': (s) => ({
		summary: line(s, 'se candidatou'),
		data: {
			...common(s),
			application: { ...s.application, status: 'pending' },
			mission: null,
		},
	}),
	'application.approved': (s) => ({
		summary: line(s, 'teve a candidatura aprovada'),
		data: { ...common(s), application: s.application, mission: s.mission },
	}),
	'application.rejected': (s) => ({
		summary: line(s, 'teve a candidatura recusada'),
		data: {
			...common(s),
			application: { ...s.application, status: 'rejected' },
			mission: null,
		},
	}),
	'mission.accepted': (s) => ({
		summary: line(s, 'aceitou a missão'),
		data: mission(s, 'fazendo'),
	}),
	'mission.script_submitted': (s) => ({
		summary: line(s, 'enviou o roteiro'),
		data: submitted(s, ['script']),
	}),
	'mission.cover_submitted': (s) => ({
		summary: line(s, 'enviou a capa'),
		data: submitted(s, ['cover']),
	}),
	'mission.caption_submitted': (s) => ({
		summary: line(s, 'enviou a legenda'),
		data: submitted(s, ['caption']),
	}),
	'mission.video_submitted': (s) => ({
		summary: line(s, 'enviou o vídeo'),
		data: {
			...mission(s, 'em_analise'),
			submission: {
				items: ['video'],
				resubmission: false,
				format: 'video',
			},
		},
	}),
	'mission.post_link_added': (s) => ({
		summary: line(s, 'publicou o post'),
		data: {
			...mission(s, 'aprovado'),
			post: {
				url: 'https://www.instagram.com/p/exemplo/',
				platform: 'instagram',
				by: 'creator',
			},
		},
	}),
	'mission.changes_requested': (s) => ({
		summary: line(s, 'recebeu um pedido de alteração'),
		data: { ...mission(s, 'editado'), request: { items: ['video'] } },
	}),
	'mission.approved': (s) => ({
		summary: line(s, 'teve a entrega aprovada'),
		data: mission(s, 'aprovado'),
	}),
	'mission.rejected': (s) => ({
		summary: line(s, 'teve a missão recusada'),
		data: {
			...common(s),
			mission: { ...s.mission, status: 'recusado', rejected_by: 'brand' },
		},
	}),
	'mission.expired': (s) => ({
		summary: line(s, 'deixou a missão expirar'),
		data: mission(s, 'expirado'),
	}),
	'mission.canceled': (s) => ({
		summary: line(s, 'foi removido(a)'),
		data: mission(s, null),
	}),
	'webhook.test': (s) => ({
		summary:
			'Teste do webhook da Conty: se esta mensagem chegou, o endpoint está configurado.',
		data: {
			...mission(s, 'em_analise'),
			submission: {
				items: ['video'],
				resubmission: false,
				format: 'video',
			},
		},
	}),
} satisfies { [Type in WebhookEventType]: Fixture<Type> };

export const eventTypes = Object.keys(fixtures) as WebhookEventType[];

/** A new event of the type, with fresh ids and time, as Conty would send it. */
export const buildEvent = (type: WebhookEventType) =>
	({
		id: crypto.randomUUID(),
		type,
		created_at: new Date().toISOString(),
		tenant: 'conty',
		...(fixtures[type] as Fixture<WebhookEventType>)(seed()),
	}) as WebhookEvent;
