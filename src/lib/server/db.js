// import pkg from 'pg';
// const { Pool } = pkg;
import { createPool } from '@vercel/postgres'; // Import Vercel's createPool
import { Kysely, PostgresDialect } from 'kysely'; // Import Kysely and PostgresDialect

// Create a Vercel-managed pool instance
let pool;

function getPool() {
	if (!pool) {
		const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

		if (connectionString) {
			// Create a real pool when a connection string is available (dev/production runtime)
			pool = createPool({ connectionString });
		} else {
			// Fallback stub during build or when running without DB access (e.g. CI, static analysis)
			pool = {
				async query() {
					return { rows: [], rowCount: 0 };
				},
				async connect() {
					return {
						query: async () => ({ rows: [], rowCount: 0 }),
						release: () => {}
					};
				},
				async end() {}
			};
		}
	}
	return pool;
}

// Export the pool instance directly for use in other modules
export const vercelPool = getPool();

// Create and export a Kysely instance configured with the Vercel pool
export const kyselyDb = new Kysely({
	dialect: new PostgresDialect({
		pool: vercelPool
	})
});

export async function query(text, params) {
	// Use the Vercel pool directly
	try {
		const res = await vercelPool.query(text, params); // Use exported pool
		return res;
	} catch (err) {
		console.error('Database query error:', err);
		throw err;
	}
	// No manual client connect/release needed for simple queries with pool.query()
}

// Update getClient to use Vercel pool's connect method
export async function getClient() {
	return vercelPool.connect(); // Use exported pool
}

// Update end function
export async function end() {
	// Check the original variable, not the export
	if (pool) {
		await pool.end(); // Use the internal pool variable to end
		pool = null;
	}
}

// Alias for compatibility with hooks.server.js
export const cleanup = end;
