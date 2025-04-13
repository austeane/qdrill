/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 * This migration applies the initial database schema.
 * Add schema creation statements here if starting from scratch.
 */
export const up = (pgm) => {
	// Example: pgm.createTable('users', { id: 'id', name: { type: 'varchar(100)', notNull: true } });
	// Currently empty as schema might exist or be managed elsewhere initially.
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 * This migration reverts the initial database schema.
 * Add statements to drop tables/types created in the 'up' function.
 */
export const down = (pgm) => {
	// Example: pgm.dropTable('users');
	// Currently empty.
};
