import { error } from '@sveltejs/kit';
import { apiFetch } from '$lib/utils/apiFetch.js';

export async function load({ params, fetch }) {
	const { id } = params;

       try {
               const practicePlan = await apiFetch(`/api/practice-plans/${id}`);

               return { practicePlan };
       } catch (err) {
               console.error(err);
               throw error(500, 'Internal Server Error');
	}
}
