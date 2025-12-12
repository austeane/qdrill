// src/lib/auth.js - Moved from server directory
import { betterAuth } from 'better-auth';
// Adjust import path to be Node.js friendly for the CLI
import { kyselyDb } from './server/db.js'; // Use relative path
import { building } from '$app/environment';

// Create auth configuration
// During prerendering, we use placeholder values to avoid accessing env variables
const createAuthConfig = () => {
	if (building) {
		// During build/prerender, use a minimal config
		return {
			secret: 'prerender-placeholder-secret',
			baseURL: 'http://localhost:3000',
			database: {
				db: kyselyDb,
				type: 'postgres'
			},
			advanced: {
				// Ensures base URL resolution uses forwarded headers when present.
				// This is required for `vercel dev`, which proxies requests to an internal port.
				trustedProxyHeaders: true
			},
			debug: false
		};
	}

	// During runtime, use process.env which is safe to access
	// These are set by Vercel at runtime
	const AUTH_SECRET = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET;
	const NODE_ENV = process.env.NODE_ENV;
	const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
	const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
	const baseURL =
		process.env.BETTER_AUTH_URL ||
		process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
		process.env.PUBLIC_BETTER_AUTH_URL ||
		undefined;

	return {
		secret: AUTH_SECRET,
		// Prefer Better Auth's own env vars. If not set, Better Auth derives baseURL from the
		// request; with `trustedProxyHeaders` it will use `x-forwarded-host`/`x-forwarded-proto`
		// so local `vercel dev` generates `http://localhost:3000/...` callback URLs (not `:60xxx`).
		baseURL,
		// Uncommented after successful migration
		socialProviders: {
			google: {
				clientId: GOOGLE_CLIENT_ID,
				clientSecret: GOOGLE_CLIENT_SECRET,
				scope: ['openid', 'email', 'profile']
			}
		},

		// Pass the Kysely instance directly
		database: {
			db: kyselyDb, // Use the imported Kysely instance
			type: 'postgres' // Add type hint for the CLI
		},
		// Ensure user exists on sign-in, attach role once, and avoid per-request DB work
		callbacks: {
			// Runs on social or credential sign-in
			async signIn({ user }) {
				if (!user?.id) return true;
				// Upsert minimal user row in our own users table (separate from auth internals)
				try {
					const existing = await kyselyDb
						.selectFrom('users')
						.select(['id'])
						.where('id', '=', user.id)
						.executeTakeFirst();
					if (!existing) {
						await kyselyDb
							.insertInto('users')
							.values({
								id: user.id,
								email: user.email ?? null,
								name: user.name ?? null,
								image: user.image ?? null,
								role: 'user'
							})
							.onConflict((oc) => oc.column('id').doNothing())
							.execute();
						console.log('[auth callbacks.signIn] Successfully created user record for:', user.id);
					}
				} catch (err) {
					console.error(
						'[auth callbacks.signIn] CRITICAL: Failed to ensure user exists in users table:',
						err
					);
					console.error('[auth callbacks.signIn] User details:', {
						id: user.id,
						email: user.email,
						name: user.name
					});
					// LONG-TERM FIX: Fail sign-in if we can't create the user record
					// This prevents foreign key violations later
					return false;
				}
				return true;
			},
			// Include role in the session without extra DB queries
			async session({ session, user }) {
				if (session.user) {
					session.user.id = user.id;
					if (!session.user.role) {
						// Try to fetch once during session creation; fallback to 'user'
						try {
							const roleRes = await kyselyDb
								.selectFrom('users')
								.select('role')
								.where('id', '=', user.id)
								.executeTakeFirst();
							session.user.role = roleRes?.role ?? 'user';
						} catch {
							session.user.role = 'user';
						}
					}
				}
				return session;
			}
		},

		advanced: {
			trustedProxyHeaders: true
		},
		debug: NODE_ENV !== 'production'
	};
};

export const auth = betterAuth(createAuthConfig());
