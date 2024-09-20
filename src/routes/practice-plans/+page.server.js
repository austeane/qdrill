export async function load({ fetch }) {
    try {
      const response = await fetch('/api/practice-plans');
      if (!response.ok) {
        throw new Error('Failed to fetch practice plans');
      }
      const practicePlans = await response.json();
  
      return {
        practicePlans
      };
    } catch (error) {
      console.error('Error fetching practice plans:', error);
      return {
        status: 500,
        error: new Error('Internal Server Error')
      };
    }
  }