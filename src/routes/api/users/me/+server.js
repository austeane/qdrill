import { json } from '@sveltejs/kit';
import { authGuard } from '$lib/server/authGuard';
import { userService } from '$lib/server/services/userService';

export const GET = authGuard(async (event) => {
    // Retrieve the session from event.locals
    const session = event.locals.session;
    const userId = session.user.id;

    try {
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
    } catch (error) {
        console.error('Error fetching user profile data:', error);
        return json({ error: 'Failed to fetch profile data' }, { status: 500 });
    }
});