// src/lib/auth.js - Moved from server directory
import { betterAuth } from "better-auth";
import { PostgresDialect } from "kysely";
import pg from "pg";
const { Pool } = pg;

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
  
  // Explicitly configure the Kysely dialect
  database: {
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      })
    }),
    type: "postgres" // Still specify the type for better-auth
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