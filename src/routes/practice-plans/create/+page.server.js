import { fail, redirect } from '@sveltejs/kit';
import { PracticePlanService } from '$lib/server/services/practicePlanService.js';
import { normalizeItems } from '$lib/utils/practicePlanUtils.js';
import { practicePlanSchema } from '$lib/validation/practicePlanSchema.ts'; // Assuming .ts is correct source
import { z } from 'zod';
import { ValidationError, ForbiddenError, DatabaseError } from '$lib/server/errors';

const practicePlanService = new PracticePlanService();

export const actions = {
	default: async ({ request, locals }) => {
		console.log('[Create Action] Incoming Request Headers:', Object.fromEntries(request.headers)); // Log headers
		const session = locals.session;
		const userId = locals.user?.id || locals.user?.userId || session?.user?.id || session?.user?.userId; // Adapt based on your exact user object structure in locals

		console.log('[Create Action] Retrieved locals.session:', session);
		console.log('[Create Action] Retrieved locals.user:', locals.user);
		console.log('[Create Action] Determined userId:', userId);

		const formData = await request.formData();
		const data = Object.fromEntries(formData);

		// --- Basic Data Parsing --- 
		const planData = {
			name: data.planName,
			description: data.planDescription,
			phase_of_season: data.phaseOfSeason || null,
			estimated_number_of_participants: data.estimatedNumberOfParticipants ? parseInt(data.estimatedNumberOfParticipants) : null,
			// Practice goals are sent as multiple entries with the same name
			practice_goals: formData.getAll('practiceGoals[]').filter(goal => goal.trim() !== ''),
			visibility: data.visibility,
			is_editable_by_others: data.isEditableByOthers === 'on', // Checkbox value is 'on' when checked
			start_time: data.startTime ? data.startTime + ':00' : null, // Add seconds for DB
			sections: JSON.parse(data.sections || '[]') // Expect sections as JSON string
		};

		console.log('[Create Action] Received planData:', planData);

		// --- Validation --- 
		try {
			// 1. Validate Metadata using a subset of the full schema
			const metadataSchema = practicePlanSchema.pick({
				name: true, description: true, phase_of_season: true, 
				estimated_number_of_participants: true, practice_goals: true,
				visibility: true, is_editable_by_others: true, start_time: true
			});
			
			const metadataResult = metadataSchema.safeParse(planData);
			if (!metadataResult.success) {
				console.warn('[Create Action] Metadata validation failed', metadataResult.error.flatten().fieldErrors);
				return fail(400, { 
					success: false,
					errors: metadataResult.error.flatten().fieldErrors,
					data: planData // Return submitted data back to form
				});
			}

			// 2. Validate Sections Structure (basic checks)
			if (!Array.isArray(planData.sections)) {
				throw new ValidationError('Sections data is missing or invalid.', { sections: 'Invalid format' });
			}
			// Ensure there's at least one item across all sections
			const totalItems = planData.sections.reduce((count, section) => count + (section.items?.length || 0), 0);
			if (totalItems === 0) {
				console.warn('[Create Action] Validation failed: No items in plan');
				return fail(400, { 
					success: false,
					errors: { general: 'A practice plan must contain at least one drill or break.' }, 
					data: planData 
				});
			}

			// --- Normalization --- 
			const normalizedSections = planData.sections.map(section => ({
				...section,
				items: normalizeItems(section.items || [])
			}));
			
			const finalPlanData = {
				...metadataResult.data, // Use validated metadata
				sections: normalizedSections
			};

			console.log('[Create Action] Calling service with data:', finalPlanData);
			const createdPlan = await practicePlanService.createPracticePlan(finalPlanData, userId);
			
			console.log('[Create Action] Service call successful, created plan ID:', createdPlan.id);
			// Use SvelteKit's redirect utility for idiomatic redirects
			throw redirect(303, `/practice-plans/${createdPlan.id}`); // This will be caught by SvelteKit

		} catch (error) {
			// If the error is already a SvelteKit redirect or fail, rethrow it
			if (error.status && error.location) { // Heuristic for a redirect object from SvelteKit
				throw error;
			}
			console.error('[Create Action] Error:', error);
			if (error instanceof ValidationError) {
				return fail(400, { success: false, errors: error.errors || { general: error.message }, data: planData });
			} else if (error instanceof ForbiddenError) {
				return fail(403, { success: false, errors: { general: error.message }, data: planData });
			} else if (error instanceof DatabaseError) {
				return fail(500, { success: false, errors: { general: 'Database error occurred.' }, data: planData });
			} else {
				return fail(500, { success: false, errors: { general: 'An unexpected error occurred.' }, data: planData });
			}
		}
	}
};