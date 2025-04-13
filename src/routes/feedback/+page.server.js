import { error } from '@sveltejs/kit';
// Assuming a FeedbackService exists or direct DB access / fetch is needed.
// Using fetch for now.
import { dev } from '$app/environment'; // To check if running locally for delete button

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, depends }) {
  try {
    // Depend on a custom identifier for invalidation
    depends('app:feedback');

    const response = await fetch('/api/feedback'); // Fetch feedback list
    if (!response.ok) {
      console.error(`Error fetching feedback: ${response.status}`);
      // Don't throw fatal error, return empty list
      // throw error(response.status, 'Failed to load feedback'); 
    }

    const feedbackEntries = response.ok ? await response.json() : [];

    return {
      feedbackEntries,
      isDev: dev // Pass dev environment status to page for conditional rendering (e.g., delete button)
    };
  } catch (err) {
    console.error('Error loading feedback page data:', err);
    // Return empty or throw error
    return {
      feedbackEntries: [],
      isDev: dev,
      loadError: 'Failed to load feedback data'
    };
    // throw error(500, 'Failed to load feedback data');
  }
} 