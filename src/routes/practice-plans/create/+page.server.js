export async function load({ fetch }) {
    try {
      // Fetch available drills for selection
      const drillsResponse = await fetch('/api/drills');
      if (!drillsResponse.ok) {
        throw new Error('Failed to fetch drills for practice plan creation');
      }
      const drills = await drillsResponse.json();
  
      // You can fetch additional data here if needed, such as existing practice plans, user information, etc.
  
      return { drills };
    } catch (error) {
      console.error('Error fetching drills for practice plan creation:', error);
      return { status: 500, error: 'Internal Server Error' };
    }
  }