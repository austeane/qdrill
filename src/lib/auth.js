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
			url: 'http://localhost:3000',
			database: {
				db: kyselyDb,
				type: 'postgres'
			},
			debug: false
		};
	}

	// During runtime, use process.env which is safe to access
	// These are set by Vercel at runtime
	const AUTH_SECRET = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET;
	const AUTH_URL = process.env.AUTH_URL;
	const NODE_ENV = process.env.NODE_ENV;
	const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
	const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
	
	return {
		secret: AUTH_SECRET,
		url: NODE_ENV === 'production' ? AUTH_URL : 'http://localhost:3000',
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
		// Uncommented after successful migration
		callbacks: {
			async session({ session, user }) {
				if (session.user) {
					session.user.id = user.id;
					try {
						const roleRes = await kyselyDb
							.selectFrom('users')
							.select('role')
							.where('id', '=', user.id)
							.executeTakeFirst();
						session.user.role = roleRes?.role ?? 'user';
					} catch (err) {
						console.error('Failed to fetch user role', err);
						session.user.role = 'user';
					}
				}
				return session;
			}
		},

		debug: NODE_ENV !== 'production'
	};
};

export const auth = betterAuth(createAuthConfig());