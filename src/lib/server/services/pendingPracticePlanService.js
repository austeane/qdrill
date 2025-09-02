import { query } from '$lib/server/db.js';
import { NotFoundError } from '$lib/server/errors.js';

async function save(token, data, expiresAt) {
  await query(
    `INSERT INTO pending_practice_plans(token, data, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at`,
    [token, data, expiresAt]
  );
  await cleanupExpired();
}

async function get(token) {
  await cleanupExpired();
  const res = await query(
    'SELECT data FROM pending_practice_plans WHERE token = $1 AND expires_at > now()',
    [token]
  );
  if (!res.rows[0]) {
    throw new NotFoundError('Pending plan not found or expired');
  }
  return res.rows[0].data;
}

async function deletePlan(token) {
  await query('DELETE FROM pending_practice_plans WHERE token = $1', [token]);
}

async function cleanupExpired() {
  await query('DELETE FROM pending_practice_plans WHERE expires_at < now()');
}

export const pendingPracticePlanService = {
  save,
  get,
  delete: deletePlan,
  _cleanupExpired: cleanupExpired
};
