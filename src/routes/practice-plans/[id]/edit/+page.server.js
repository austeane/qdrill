export async function load({ params, fetch }) {
    const { id } = params;
  
    try {
        console.log('[Edit Page Server] Fetching practice plan:', id);
        const response = await fetch(`/api/practice-plans/${id}`);
        
        if (!response.ok) {
            console.error('[Edit Page Server] Response not OK:', response.status);
            throw new Error('Failed to fetch practice plan details');
        }
        
        const practicePlan = await response.json();
        console.log('[Edit Page Server] Fetched practice plan:', practicePlan);
    
        return { practicePlan };
    } catch (error) {
        console.error('[Edit Page Server] Error:', error);
        return { status: 500, error: 'Internal Server Error' };
    }
}