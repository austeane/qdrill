// src/lib/auth.js - Moved from server directory
import { betterAuth } from 'better-auth';
// Adjust import path to be Node.js friendly for the CLI
import { kyselyDb } from './server/db.js'; // Use relative path

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,
	url: process.env.BETTER_AUTH_URL,
	// Uncommented after successful migration
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
			}
			return session;
		}
	},

	debug: process.env.NODE_ENV !== 'production'
});
