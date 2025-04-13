import { drillService } from '$lib/server/services/drillService';

export async function load({ url }) {
    try {
        // Extract context from URL parameters (examples)
        const skillLevel = url.searchParams.get('skillLevel');
        const participants = url.searchParams.get('participants');
        // Add other relevant params like duration, goals, etc. as needed

        const filters = {};
        if (skillLevel) filters.skill_level = [skillLevel]; // Assuming single skill level context
        const numParticipants = participants ? parseInt(participants) : undefined;
        if (numParticipants) {
            filters.number_of_people_min = numParticipants;
            filters.number_of_people_max = numParticipants;
            // Or adjust logic if a range is more appropriate
        }

        // Define columns needed by the component
        const columns = [
            'id', 
            'name', 
            'brief_description', 
            'suggested_length', // Assuming this maps to drill.duration
            'number_of_people_min', // Assuming this maps to drill.min_participants
            'number_of_people_max'  // Assuming this maps to drill.max_participants
            // Add other fields needed by addDrill if the whole object isn't passed
        ];

        // Define options (high limit, specific columns)
        const options = {
            limit: 100, // Fetch up to 100 relevant drills
            columns: columns,
            // Default sorting might be fine, or add specific sorting logic
            // sortBy: 'relevance' // Placeholder for potential future relevance sorting
        };

        // Call the service directly
        // Note: Assumes getFilteredDrills handles visibility implicitly
        const result = await drillService.getFilteredDrills(filters, options);
        
        return {
            drills: result.items || [] // Pass the fetched items
        };
    } catch (error) {
        console.error('Error loading drills:', error);
        return {
            drills: []  // Return empty array on error to prevent undefined.filter()
        };
    }
}