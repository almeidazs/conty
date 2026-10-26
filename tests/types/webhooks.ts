import { construct } from 'contyos/webhooks';

export const handle = async (body: string, signature: string | null) => {
	const event = await construct({
		body,
		header: signature,
		secret: 'whsec_x',
	});

	if (!event) return null;

	if (event.type === 'application.approved') return event.data.mission.id;

	return event.summary;
};
