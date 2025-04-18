// src/lib/auth.js - Moved from server directory
import { betterAuth } from "better-auth";
import { kyselyDb } from '$lib/server/db'; // Import the Kysely instance

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  url: process.env.BETTER_AUTH_URL,
  // Uncommented after successful migration
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scope: ["openid", "email", "profile"]
    }
  },
  
  // Pass the Kysely instance directly
  database: {
    db: kyselyDb, // Use the imported Kysely instance
    // dialect: new VercelPostgresDialect({ pool: vercelPool }), // Remove dialect config
    // type: "postgres" // Type is inferred when passing 'db'
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