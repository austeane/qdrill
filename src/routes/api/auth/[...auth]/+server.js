import { handle } from "$lib/server/auth"

// Export all auth handler methods
export const GET = handle.GET;
export const POST = handle.POST;
export const PUT = handle.PUT;
export const DELETE = handle.DELETE;