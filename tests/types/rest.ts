import { REST, type RESTResult } from 'contyos/rest';

const rest = new REST({ secret: 'secret' });

export const run = async () => {
	const result: RESTResult<{ id: string }> = await rest.get('/users');

	if (result.ok) {
		const id: string = result.data.id;

		return id;
	}

	return result.error.type;
};
