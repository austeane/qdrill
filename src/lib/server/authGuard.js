import { redirect } from '@sveltejs/kit';

export function authGuard(handler) {
  return async (event) => {
    const session = await event.locals.getSession();
    if (!session?.user) {
      throw redirect(303, '/login');
    }
    return handler(event);
  };
}
