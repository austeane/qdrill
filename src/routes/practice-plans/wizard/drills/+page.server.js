export async function load({ fetch }) {
    try {
        const response = await fetch('/api/drills');
        if (!response.ok) {
            throw new Error('Failed to fetch drills');
        }
        
        const data = await response.json();
        
        return {
            drills: data.drills || []  // Ensure drills is always an array
        };
    } catch (error) {
        console.error('Error loading drills:', error);
        return {
            drills: []  // Return empty array on error to prevent undefined.filter()
        };
    }
}