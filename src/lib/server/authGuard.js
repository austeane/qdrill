import { error } from '@sveltejs/kit';

export function authGuard(handler) {
  return async (event) => {
    const session = await event.locals.getSession();
    if (!session?.user) {
      throw error(401, {
        message: 'Unauthorized - Please sign in with Google to continue'
      });
    }
    return handler(event);
  };
}
