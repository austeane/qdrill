// Mock for authGuard.js
export const authGuard = (handler) => {
  return async (event) => {
    // If test provides mockUnauthorized, simulate unauthorized access
    if (event.locals.mockUnauthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Otherwise proceed with the handler
    return handler(event);
  };
};