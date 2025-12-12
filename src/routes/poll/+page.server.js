import { drillService } from '$lib/server/services/drillService.js';
import { apiFetch } from '$lib/utils/apiFetch.js';
// Assuming a service exists for poll options or direct DB access is needed
// For now, we'll use fetch within the load function, but ideally, a service would be better.

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, depends }) {
	try {
		// Fetch poll options server-side
		// Using fetch here, but a pollOptionService would be cleaner
		let pollData = { options: [] };
		try {
			pollData = await apiFetch('/api/poll/options', {}, fetch);
		} catch (err) {
			console.error(`Error fetching poll options:`, err);
		}

		// Fetch all drill names server-side
		// Note: This still fetches *all* names. A future optimization could be
		// an API endpoint `/api/drills/search?q=...` called from the client
		// when the user actually types in the search box.
		const drillNames = await drillService.getDrillNames();

		// Depend on a custom identifier for poll data invalidation
		depends('app:poll');

		return {
			pollOptions: pollData.options, // Pass options to the page
			allDrillNames: drillNames // Pass all drill names for client-side filtering initially
		};
	} catch (err) {
		console.error('Error loading poll page data:', err);
		// Gracefully handle error, return empty arrays so page doesn't crash
		// Consider logging this error properly
		return {
			pollOptions: [],
			allDrillNames: []
			// Optionally add an error flag: loadError: 'Failed to load page data'
		};
		// Or throw a fatal error:
		// throw error(500, 'Failed to load data for the poll page');
	}
}
