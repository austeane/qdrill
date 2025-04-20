import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { userService } from '$lib/server/services/userService';
import { handleApiError } from '../../utils/handleApiError';

export const GET = authGuard(async ({ locals }) => {
    try {
        // Retrieve the session from event.locals
        const session = await locals.auth();
        const userId = session.user.id;

        // Ensure we have a row in users table for this Better‑Auth user
        await userService.ensureUserExists(session.user);

        // Use the userService to fetch the complete profile
        const profileData = await userService.getUserProfile(userId);
        
        if (!profileData) {
            return json({ error: 'User not found' }, { status: 404 });
        }
        
        // Transform the data to match the expected format in the frontend
        return json({
            user: profileData.user,
            drills: profileData.drills,
            practicePlans: profileData.practicePlans,
            formations: profileData.formations,
            votes: profileData.votes,
            comments: profileData.comments
        });
    } catch (err) {
        // Use the centralized error handler
        return handleApiError(err);
    }
});