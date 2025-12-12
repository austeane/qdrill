import { json } from '@sveltejs/kit';
import { seasonService } from '$lib/server/services/seasonService.js';

export async function GET({ locals, params }) {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const season = await seasonService.getById(params.seasonId);
		if (!season) {
			return json({ error: 'Season not found' }, { status: 404 });
		}
		// Permission check happens in service
		return json({
			public_view_url: `/seasons/${params.seasonId}/view?token=${season.public_view_token}`,
			ics_url: `/api/seasons/${params.seasonId}/calendar.ics?token=${season.ics_token}`,
			public_view_token: season.public_view_token,
			ics_token: season.ics_token
		});
	} catch (error) {
		return json({ error: error.message }, { status: error.statusCode || 500 });
	}
}

export async function POST({ locals, params, request }) {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const { type } = await request.json();

		let season;
		if (type === 'public') {
			season = await seasonService.rotatePublicToken(params.seasonId, locals.user.id);
		} else if (type === 'ics') {
			season = await seasonService.rotateIcsToken(params.seasonId, locals.user.id);
		} else {
			return json({ error: 'Invalid token type' }, { status: 400 });
		}

		return json({
			public_view_url: `/seasons/${params.seasonId}/view?token=${season.public_view_token}`,
			ics_url: `/api/seasons/${params.seasonId}/calendar.ics?token=${season.ics_token}`,
			public_view_token: season.public_view_token,
			ics_token: season.ics_token
		});
	} catch (error) {
		return json({ error: error.message }, { status: error.statusCode || 500 });
	}
}
