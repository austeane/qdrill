import pkg from 'pg';
const { Pool } = pkg;

// Create a singleton pool instance
let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10, // Increased from 1 to handle concurrent connections better
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // More graceful error handling without process.exit()
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      // Attempt to create a new pool if the current one has fatal errors
      pool = null;
    });
  }
  return pool;
}

export async function query(text, params) {
  const client = await getPool().connect();
  try {
    const res = await client.query(text, params);
    return res;
  } catch (err) {
    console.error('Database query error:', err);
    throw err; // Re-throw to allow handling by the caller
  } finally {
    client.release();
  }
}

// Add a new cleanup function for handling request-specific cleanup
export async function cleanup() {
    // This is a no-op function since we want to keep the pool alive
    // If we add request-specific resources in the future, we can clean them up here
    console.debug('Cleaning up request-specific database resources');
}

// Keep the end() function for graceful shutdown scenarios
export async function end() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}