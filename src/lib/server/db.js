// import pkg from 'pg';
// const { Pool } = pkg;
import { createPool } from '@vercel/postgres'; // Import Vercel's createPool
import { Kysely, PostgresDialect, sql } from 'kysely'; // Import Kysely, PostgresDialect, and sql

// Create a Vercel-managed pool instance
let pool;

function getPool() {
	if (!pool) {
		const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

		if (connectionString) {
			// Create a real pool when a connection string is available (dev/production runtime)
			pool = createPool({ connectionString });
		} else {
			// Fail fast in real production runtime; allow a stub for local/dev/test/build and Vercel previews.
			const isProdRuntime =
				process.env.NODE_ENV === 'production' &&
				(process.env.VERCEL_ENV ? process.env.VERCEL_ENV === 'production' : true);
			if (isProdRuntime) {
				throw new Error('Database connection string missing. Set POSTGRES_URL or DATABASE_URL.');
			}
			console.warn(
				'[db] No connection string found; using stub pool. DB queries will return empty results.'
			);
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

// Re-export sql from Kysely so other modules can import it from here
export { sql };

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
