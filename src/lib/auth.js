// src/lib/auth.js - Moved from server directory
import { betterAuth } from 'better-auth';
// Adjust import path to be Node.js friendly for the CLI
import { kyselyDb } from './server/db.js'; // Use relative path
import { env } from '$env/dynamic/private';

export const auth = betterAuth({
	secret: env.AUTH_SECRET || env.BETTER_AUTH_SECRET,
	url: env.NODE_ENV === 'production' ? env.AUTH_URL : 'http://localhost:3000',
	// Uncommented after successful migration
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
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

	debug: env.NODE_ENV !== 'production'
});
