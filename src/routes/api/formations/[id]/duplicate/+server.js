import { json } from '@sveltejs/kit';
import { formationService } from '$lib/server/services/formationService';
import { handleApiError } from '../../../utils/handleApiError.js';

export async function POST({ params, locals }) {
	try {
		const { id } = params;
		const session = locals.session;
		const userId = session?.user?.id ?? null;

		const formationId = parseInt(id);
		if (isNaN(formationId)) {
			return json({ error: 'Invalid formation ID' }, { status: 400 });
		}

		const newFormation = await formationService.duplicateFormation(formationId, userId);

		return json(newFormation, { status: 201 });
	} catch (err) {
		return handleApiError(err);
	}
} 