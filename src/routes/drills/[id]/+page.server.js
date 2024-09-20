export async function load({ params, fetch }) {
    const { id } = params;
  
    try {
      const response = await fetch(`/api/drills/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch drill details');
      }
      const drill = await response.json();
  
      return { drill };
    } catch (error) {
      console.error(error);
      return { status: 500, error: 'Internal Server Error' };
    }
  }