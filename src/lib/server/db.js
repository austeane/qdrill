import { createPool } from '@vercel/postgres';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { building } from '$app/environment';

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
				!building &&
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

// Pool used by Kysely dialect; kept internal so callers use Kysely.
const vercelPool = getPool();

// Create and export a Kysely instance configured with the Vercel pool
export const kyselyDb = new Kysely({
	dialect: new PostgresDialect({
		pool: vercelPool
	})
});

// Re-export sql from Kysely so other modules can import it from here.
export { sql };
