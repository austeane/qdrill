import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth }             from "$lib/auth"; // Import your configured better-auth instance

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  // Use the better-auth handler
  // This automatically manages sessions, adds locals like event.locals.user, etc.
  return svelteKitHandler({ event, resolve, auth });
} 