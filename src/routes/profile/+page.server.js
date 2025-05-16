import { error } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';

export const load = authGuard(async ({ fetch }) => {
    try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
            const userData = await response.json();
            return { userData };
        } else {
            let errorData;
            let responseText = '';
            try {
                responseText = await response.text();
                if (responseText) {
                    errorData = JSON.parse(responseText);
                } else {
                    // console.warn('/api/users/me returned an empty error response body.');
                }
            } catch (jsonError) {
                // console.error('Failed to parse JSON error response from /api/users/me. Status:', response.status, jsonError);
                // console.error('Raw response text from /api/users/me:', responseText);
                throw error(response.status, {
                    message: `API returned non-JSON error (Status: ${response.status}). Response: ${responseText || 'Empty response'}`,
                    rawResponse: responseText
                });
            }
            const errorMessage = errorData?.error?.message ||
                               errorData?.message ||
                               (responseText ? `Failed to load profile data. API Response: ${responseText}` : `Failed to load profile data. API returned status ${response.status} with empty body`);
            const errorCode = errorData?.error?.code || errorData?.code || 'UNKNOWN_PROFILE_LOAD_ERROR';
            
            throw error(response.status, { 
                message: errorMessage,
                code: errorCode,
                details: errorData?.error?.details 
            });
        }
    } catch (err) {
        // console.error('Error loading profile data (+page.server.js catch):', err);
        console.error('Error loading profile data:', err);
        if (err.status && err.body) {
             throw error(err.status, err.body);
        }
        throw error(500, { message: 'An error occurred while loading the profile data (outer catch)', code: 'PROFILE_LOAD_FAILED' });
    }
});
