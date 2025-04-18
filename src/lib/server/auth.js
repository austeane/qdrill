// src/lib/server/auth.js
import Google from '@auth/core/providers/google'
import PostgresAdapter from '@auth/pg-adapter'
import { SvelteKitAuth } from '@auth/sveltekit'
import { query } from '$lib/server/db'

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: PostgresAdapter({
    query: async (sql, params) => {
      const result = await query(sql, params);
      return {
        rows: result.rows,
        rowCount: result.rowCount
      };
    }
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Custom logic to handle user sign-in
      return true;
    },
    async session({ session, user }) {
      // Include user ID and role in the session
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role; // Assuming 'user' object from adapter has 'role'
      }
      return session;
    },
    // You can remove the jwt callback if not using JWTs
  },
  debug: true, // Enable debug mode for more detailed logs
})