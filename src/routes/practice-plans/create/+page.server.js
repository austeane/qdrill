export async function load({ fetch }) {
    try {
      // Fetch all drills for practice plan creation
      const drillsResponse = await fetch('/api/drills?all=true');
      if (!drillsResponse.ok) {
        throw new Error('Failed to fetch drills for practice plan creation');
      }
      const data = await drillsResponse.json();
  
      return { drills: data.drills };
    } catch (error) {
      console.error('Error fetching drills for practice plan creation:', error);
      return { status: 500, error: 'Internal Server Error' };
    }
  }