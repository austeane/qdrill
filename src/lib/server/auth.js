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
      console.log('Sign in callback', { user, account, profile });
      return true;
    },
    async session({ session, user }) {
      console.log('Session callback', { session, user });
      session.user.id = user.id;
      return session;
    },
    async jwt({ token, user }) {
      console.log('JWT callback', { token, user });
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  debug: true, // Enable debug mode for more detailed logs
})