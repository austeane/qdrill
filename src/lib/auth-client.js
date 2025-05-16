// src/lib/auth-client.js
import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient();

// Helper functions for use in components
export const useSession = authClient.useSession;
export const signIn = authClient.signIn;
export const signOut = authClient.signOut;
