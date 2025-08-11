import { apiFetch } from '$lib/utils/apiFetch.js';
import { sanitizeHtml } from '$lib/utils/sanitizeHtml.js';

export async function load({ params, fetch }) {
        const { id } = params;
        console.log('[Page Server] Loading drill with ID:', id);

        try {
                const drill = await apiFetch(`/api/drills/${id}?includeVariants=true`, {}, fetch);
                // Sanitize HTML fields before returning
                if (drill) {
                  drill.brief_description = sanitizeHtml(drill.brief_description);
                  drill.detailed_description = sanitizeHtml(drill.detailed_description);
                }
                return { drill };
        } catch (error) {
                console.error('[Page Server] Error:', error);
                return { status: 500, error: 'Internal Server Error' };
        }
}
