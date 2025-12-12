import { json } from '@sveltejs/kit';
import { drillService } from '$lib/server/services/drillService';
import { dev } from '$app/environment';
import { authGuard } from '$lib/server/authGuard';
import { NotFoundError, ForbiddenError, ValidationError, DatabaseError } from '$lib/server/errors';
import { handleApiError } from '../../utils/handleApiError.js';

export async function GET({ params, locals, url }) {
	const { id } = params;
	const includeVariants = url.searchParams.get('includeVariants') === 'true';
	const session = locals.session;
	const userId = session?.user?.id;

	try {
		const drillId = parseInt(id);
		if (!id || isNaN(drillId)) {
			throw new ValidationError('Invalid Drill ID format');
		}

		let drill;
		if (includeVariants) {
			drill = await drillService.getDrillWithVariations(drillId, userId);
		} else {
			drill = await drillService.getById(drillId, drillService.defaultColumns, userId);
		}

		// Check visibility and ownership
		if (drill.visibility === 'private') {
			if (!userId || String(drill.created_by) !== String(userId)) {
				throw new ForbiddenError('Unauthorized to view this private drill');
			}
		}

		// If this is a variation, get the parent name
		if (drill.parent_drill_id && !drill.variations) {
			try {
				const parentDrill = await drillService.getById(
					drill.parent_drill_id,
					drillService.defaultColumns,
					userId
				);
				if (parentDrill) {
					drill.parent_drill_name = parentDrill.name;
				}
			} catch (parentErr) {
				if (parentErr instanceof NotFoundError) {
					console.warn(
						`Parent drill ID ${drill.parent_drill_id} not found for variation ${drill.id}`
					);
					drill.parent_drill_name = '[Parent Deleted]'; // Indicate parent is gone
				} else {
					throw parentErr; // Re-throw unexpected errors getting parent
				}
			}
		}

		return json(drill);
	} catch (err) {
		return handleApiError(err);
	}
}

// Wrap PUT handler with authGuard
export const PUT = authGuard(async ({ params, request, locals }) => {
	const { id } = params;
	const session = locals.session;
	const userId = session?.user?.id;

	try {
		const drillId = parseInt(id);
		if (!id || isNaN(drillId)) {
			throw new ValidationError('Invalid Drill ID format');
		}

		const drillData = await request.json();

		// Basic validation
		if (!drillData.name || !drillData.brief_description) {
			throw new ValidationError('Required fields missing: name, brief_description');
		}

		// Use DrillService to update the drill (now also updates votes)
		const updatedDrill = await drillService.updateDrill(drillId, drillData, userId);

		return json(updatedDrill);
	} catch (err) {
		return handleApiError(err);
	}
});

// Define core delete logic (used by guarded handler)
const handleDelete = async ({ params, locals }) => {
	const { id } = params;
	const session = locals.session;
	const userId = session?.user?.id;

	try {
		const drillId = parseInt(id);
		if (!id || isNaN(drillId)) {
			throw new ValidationError('Invalid Drill ID format');
		}

		// Pass userId for authorization check within the service
		const success = await drillService.deleteDrill(drillId, userId);

		if (!success) {
			// Service returns false if not found, true if deleted
			throw new NotFoundError(`Drill with ID ${drillId} not found for deletion.`);
		}

		return json({ message: 'Drill deleted successfully' }, { status: 200 });
	} catch (err) {
		// Catch FK constraint errors specifically if service doesn't handle them gracefully
		if (err?.code === '23503') {
			throw new DatabaseError('Cannot delete: drill is referenced by other items', err); // Wrap it
		}
		// Re-throw other errors to be handled by the main handler/helper
		throw err;
	}
};

// Export DELETE handler, applying authGuard only when not in dev mode
export const DELETE = async (event) => {
	try {
		const { id } = event.params;
		const session = event.locals.session;
		const userId = session?.user?.id || null; // Used for dev check

		const drillId = parseInt(id);
		if (!id || isNaN(drillId)) {
			throw new ValidationError('Invalid Drill ID format');
		}

		const allowDevBypass =
			dev &&
			process.env.ALLOW_DEV_DELETE_BYPASS === 'true' &&
			userId &&
			session?.user?.role === 'admin';

		if (allowDevBypass) {
			console.log(`[DEV MODE BYPASS] Attempting deletion for drill ${drillId} with related data.`);
			// Call the service method with deleteRelated: true
			// Pass userId (can be null) - service checks if drill.created_by === userId OR (drill.created_by === null AND deleteRelated)
			const result = await drillService.deleteDrill(drillId, userId, { deleteRelated: true });

			if (!result) {
				// Service handles not found case by returning false
				throw new NotFoundError(`Drill with ID ${drillId} not found for deletion (dev mode).`);
			}

			return json(
				{ success: true, message: 'Drill and related data deleted (dev mode)' },
				{ status: 200 }
			);
		} else {
			if (
				dev &&
				process.env.ALLOW_DEV_DELETE_BYPASS === 'true' &&
				session?.user?.role !== 'admin'
			) {
				console.warn(
					`[DEV MODE BYPASS BLOCKED] ALLOW_DEV_DELETE_BYPASS enabled but user is not admin.`
				);
			}
			// In production, use the authGuard with the original handleDelete logic
			const guardedDelete = authGuard(handleDelete);
			return await guardedDelete(event); // Ensure guarded function is awaited
		}
	} catch (err) {
		return handleApiError(err);
	}
};
