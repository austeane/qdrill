export async function load({ params, fetch }) {
    const { id } = params;
    console.log('[Page Server] Loading drill with ID:', id);
  
    try {
      const response = await fetch(`/api/drills/${id}`);
      console.log('[Page Server] API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch drill details');
      }
      
      const drill = await response.json();
      console.log('[Page Server] Drill data:', drill);
  
      return { drill };
    } catch (error) {
      console.error('[Page Server] Error:', error);
      return { status: 500, error: 'Internal Server Error' };
    }
}