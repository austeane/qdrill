import { redirect } from '@sveltejs/kit';

export function authGuard() {
  return async ({ event, resolve }) => {
    if (!event.locals.session?.user) {
      throw redirect(303, '/login');
    }
    return resolve(event);
  };
}