import { error, fail, redirect } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService';
import { authGuard } from '$lib/server/authGuard'; // Import authGuard
import { PracticePlanService } from '$lib/server/services/practicePlanService.js';
import { normalizeItems } from '$lib/utils/practicePlanUtils.js';
import { practicePlanSchema } from '$lib/validation/practicePlanSchema.ts';
import { z } from 'zod';
import { NotFoundError, ForbiddenError, ValidationError, DatabaseError } from '$lib/server/errors';
import { apiFetch } from '$lib/utils/apiFetch.js';

const COOKIE_NAME = 'pendingPlanToken'; // Add cookie name constant

/** @type {import('./$types').PageServerLoad} */
export const load = authGuard(async ({ params, locals, cookies, fetch }) => {
	// Add cookies and fetch
	const { id } = params;
	const userId = locals.user?.id; // authGuard ensures locals.session and locals.user exist
	let pendingPlanData = null;
	let practicePlan = null;

	// --- 1. Check for Pending Plan Data ---
	const token = cookies.get(COOKIE_NAME);
	if (token) {
		console.log(`[Load /practice-plans/edit] Found pending plan token: ${token}`);
                try {
                        const data = await apiFetch('/api/pending-plans', {}, fetch);
                        if (data && data.plan) {
                                pendingPlanData = data.plan;
                                console.log('[Load /practice-plans/edit] Successfully loaded pending plan data.');
                                // Delete after load
                                try {
                                        await apiFetch('/api/pending-plans', { method: 'DELETE' }, fetch);
                                        console.log('[Load /practice-plans/edit] Pending plan deleted after load.');
                                } catch (deleteError) {
                                        console.error(
                                                '[Load /practice-plans/edit] Error deleting pending plan after load:',
                                                deleteError
                                        );
                                }
                        } else {
                                console.log('[Load /practice-plans/edit] Pending plan data from API was null/empty.');
                                cookies.delete(COOKIE_NAME, { path: '/' });
                        }
                } catch (err) {
                        console.error('[Load /practice-plans/edit] Exception fetching/processing pending plan:', err);
                        cookies.delete(COOKIE_NAME, { path: '/' });
                }
	}

	// --- 2. Load Existing Practice Plan (only if no pending data loaded) ---
	if (!pendingPlanData) {
		try {
			const planId = parseInt(id);
			if (isNaN(planId)) {
				throw error(400, 'Invalid Practice Plan ID');
			}

			// Fetch the plan using the service
			practicePlan = await practicePlanService.getPracticePlanById(planId, userId);

			// Check if the user can edit this plan
			const canEdit = await practicePlanService.canUserEdit(planId, userId);
			if (!canEdit) {
				throw error(403, 'You do not have permission to edit this practice plan');
			}
		} catch (err) {
			console.error('[Edit Practice Plan Page Server] Error loading existing plan:', err);
			// Re-throw SvelteKit errors or specific service errors
			if (err.status) {
				throw error(err.status, err.body?.message || 'Error loading practice plan');
			}
			if (err.message === 'Practice plan not found') {
				throw error(404, 'Practice plan not found');
			}
			if (err.message === 'Unauthorized') {
				throw error(403, 'You do not have permission to view this practice plan');
			}
			throw error(500, 'Internal Server Error while loading practice plan edit page');
		}
	}

	// --- 3. Return Data ---
	// Prioritize pending data if it exists
	return {
		practicePlan: pendingPlanData || practicePlan
		// Optionally add a flag if we need to distinguish between pending/existing on the client,
		// but the form initialization logic should handle pendingPlanData correctly.
		// isPendingData: !!pendingPlanData
	};
});

/** @type {import('./$types').Actions} */
export const actions = {
	default: authGuard(async ({ request, locals, params }) => {
		const session = locals.session;
		const userId = locals.user?.id; // Fix: use locals.user.id like in the load function
		const planId = parseInt(params.id);

		if (isNaN(planId)) {
			return fail(400, { success: false, errors: { general: 'Invalid Practice Plan ID' } });
		}

		const formData = await request.formData();
		const data = Object.fromEntries(formData);

		// --- Basic Data Parsing ---
		const sections = JSON.parse(data.sections || '[]');
		
		const planData = {
			name: data.planName,
			description: data.planDescription,
			phase_of_season: data.phaseOfSeason || null,
			estimated_number_of_participants: data.estimatedNumberOfParticipants
				? parseInt(data.estimatedNumberOfParticipants)
				: null,
			practice_goals: formData.getAll('practiceGoals[]').filter((goal) => goal.trim() !== ''),
			visibility: data.visibility,
			is_editable_by_others: data.isEditableByOthers === 'on',
			start_time: data.startTime ? data.startTime + ':00' : null,
			sections
		};

		console.log(`[Edit Action - Plan ${planId}] Received planData:`, planData);

		// --- Validation ---
		try {
			// 1. Validate Metadata
			const metadataSchema = practicePlanSchema.pick({
				name: true,
				description: true,
				phase_of_season: true,
				estimated_number_of_participants: true,
				practice_goals: true,
				visibility: true,
				is_editable_by_others: true,
				start_time: true
			});

			const metadataResult = metadataSchema.safeParse(planData);
			if (!metadataResult.success) {
				console.warn(
					`[Edit Action - Plan ${planId}] Metadata validation failed`,
					metadataResult.error.flatten().fieldErrors
				);
				return fail(400, {
					success: false,
					errors: metadataResult.error.flatten().fieldErrors,
					data: planData
				});
			}

			// 2. Validate Sections Structure
			if (!Array.isArray(planData.sections)) {
				throw new ValidationError('Sections data is missing or invalid.', {
					sections: 'Invalid format'
				});
			}
			const totalItems = planData.sections.reduce(
				(count, section) => count + (section.items?.length || 0),
				0
			);
			if (totalItems === 0) {
				console.warn(`[Edit Action - Plan ${planId}] Validation failed: No items in plan`);
				return fail(400, {
					success: false,
					errors: { general: 'A practice plan must contain at least one drill or break.' },
					data: planData
				});
			}

			// --- Normalization ---
			const normalizedSections = planData.sections.map((section) => ({
				...section,
				items: normalizeItems(section.items || [])
			}));

			const finalPlanData = {
				...metadataResult.data, // Use validated metadata
				sections: normalizedSections
			};

			console.log(`[Edit Action - Plan ${planId}] Calling service with data:`, finalPlanData);
			await practicePlanService.updatePracticePlan(planId, finalPlanData, userId);

			console.log(`[Edit Action - Plan ${planId}] Service call successful.`);
			// Redirect on success
			redirect(303, `/practice-plans/${planId}`);
		} catch (err) {
			// If SvelteKit is throwing a redirect, rethrow it to let SvelteKit handle it
			if (
				err &&
				typeof err.status === 'number' &&
				err.status >= 300 &&
				err.status < 400 &&
				err.location
			) {
				throw err; // Rethrow the redirect
			}

			console.error(`[Edit Action - Plan ${planId}] Error:`, err); // Log actual errors
			if (err instanceof ValidationError) {
				return fail(400, {
					success: false,
					errors: err.errors || { general: err.message },
					data: planData
				});
			} else if (err instanceof ForbiddenError) {
				return fail(403, { success: false, errors: { general: err.message }, data: planData });
			} else if (err instanceof NotFoundError) {
				// This could happen if the plan is deleted between load and submit
				return fail(404, {
					success: false,
					errors: { general: 'Practice plan not found.' },
					data: planData
				});
			} else if (err instanceof DatabaseError) {
				return fail(500, {
					success: false,
					errors: { general: 'Database error occurred.' },
					data: planData
				});
			} else {
				return fail(500, {
					success: false,
					errors: { general: 'An unexpected error occurred.' },
					data: planData
				});
			}
		}
	})
};
