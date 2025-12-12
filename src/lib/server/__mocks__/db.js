// Vitest manual mock for `$lib/server/db`.
// Re-export the shared Kysely-first mock used by service tests.
export * from '../__tests__/mocks/db.js';

import * as shared from '../__tests__/mocks/db.js';

// Provide a default export for any legacy tests that might import it.
export default shared;
