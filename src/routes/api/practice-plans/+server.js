import { json } from '@sveltejs/kit';
import { practicePlanService } from '$lib/server/services/practicePlanService.js';

// Custom error class for better error handling
class PracticePlanError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function GET({ url, locals }) {
  const userId = locals.user?.id;
  
  try {
    const result = await practicePlanService.getAll({ userId });
    return json(result.items);
  } catch (error) {
    console.error('Error fetching practice plans:', error);
    return json(
      { error: 'Failed to fetch practice plans', details: error.message },
      { status: 500 }
    );
  }
}

export const POST = async ({ request, locals }) => {
  try {
    const practicePlan = await request.json();
    const userId = locals.user?.id;

    // Create practice plan using the service
    const result = await practicePlanService.createPracticePlan(practicePlan, userId);
    
    return json(
      { id: result.id, message: 'Practice plan created successfully' }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Practice Plan Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return json({
      error: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    }, {
      status: error instanceof PracticePlanError ? error.status : 500
    });
  }
};
