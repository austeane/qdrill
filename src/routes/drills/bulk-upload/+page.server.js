export async function load({ fetch }) {
    try {
      // Example: Fetch existing drills for validation or other purposes
      const response = await fetch('/api/drills');
      if (!response.ok) {
        throw new Error('Failed to fetch drills for bulk upload');
      }
      const drills = await response.json();
  
      return { drills };
    } catch (error) {
      console.error('Error fetching drills for bulk upload:', error);
      return { status: 500, error: 'Internal Server Error' };
    }
  }