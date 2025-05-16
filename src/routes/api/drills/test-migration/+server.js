import { json } from '@sveltejs/kit';
import { fabricToExcalidraw } from '$lib/utils/diagramMigration';
import { dev } from '$app/environment';
import { handleApiError } from '../../utils/handleApiError.js';
import { ForbiddenError, ValidationError, InternalServerError } from '$lib/server/errors.js';

export async function POST({ request }) {
	// Only allow in development mode
	if (!dev) {
		return handleApiError(
			new ForbiddenError('Test migration endpoint is only available in development mode.')
		);
	}

	try {
		let diagram;
		try {
			const body = await request.json();
			diagram = body.diagram;
		} catch (jsonError) {
			throw new ValidationError('Invalid JSON payload', { details: jsonError.message });
		}

		if (!diagram) {
			throw new ValidationError('Missing diagram field in request body');
		}

		const convertedDiagram = fabricToExcalidraw(diagram);
		if (!convertedDiagram) {
			throw new InternalServerError('Diagram conversion failed.');
		}

		return json(convertedDiagram);
	} catch (err) {
		return handleApiError(err);
	}
}
