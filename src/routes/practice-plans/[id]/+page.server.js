import { error } from '@sveltejs/kit';

export async function load({ params, fetch }) {
	const { id } = params;

	try {
		// Fetch practice plan details, including drills and breaks
		const response = await fetch(`/api/practice-plans/${id}`);
		if (!response.ok) {
			throw new Error('Failed to fetch practice plan');
		}
		const practicePlan = await response.json();

		return { practicePlan };
	} catch (err) {
		console.error(err);
		throw error(500, 'Internal Server Error');
	}
}
