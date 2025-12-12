import { vi } from 'vitest';

// Mock for database operations
// Provide a default implementation for query that returns empty rows if not overridden
const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
// Basic mock for Kysely's fluent interface
const mockKyselyInterface = {
	selectFrom: vi.fn().mockReturnThis(),
	selectAll: vi.fn().mockReturnThis(),
	select: vi.fn().mockReturnThis(),
	distinctOn: vi.fn().mockReturnThis(),
	leftJoin: vi.fn().mockReturnThis(),
	innerJoin: vi.fn().mockReturnThis(),
	rightJoin: vi.fn().mockReturnThis(),
	fullJoin: vi.fn().mockReturnThis(),
	where: vi.fn().mockReturnThis(),
	whereRef: vi.fn().mockReturnThis(),
	orWhere: vi.fn().mockReturnThis(),
	andWhere: vi.fn().mockReturnThis(),
	orderBy: vi.fn().mockReturnThis(),
	groupBy: vi.fn().mockReturnThis(),
	limit: vi.fn().mockReturnThis(),
	offset: vi.fn().mockReturnThis(),
	insertInto: vi.fn().mockReturnThis(),
	values: vi.fn().mockReturnThis(),
	updateTable: vi.fn().mockReturnThis(),
	set: vi.fn().mockReturnThis(),
	deleteFrom: vi.fn().mockReturnThis(),
	returning: vi.fn().mockReturnThis(),
	execute: vi.fn().mockResolvedValue({ rows: [] }),
	executeTakeFirst: vi.fn().mockResolvedValue(undefined),
	stream: vi.fn().mockResolvedValue([])
};

const db = {
	query: mockQuery, // For direct SQL queries. Used mockQuery here.
	getClient: vi.fn(() => ({
		// For transactions
		query: vi.fn(),
		release: vi.fn()
	})),
	kyselyDb: mockKyselyInterface, // For Kysely query builder
	transaction: vi.fn(async (callback) => {
		// Mock for db.transaction
		const mockClient = {
			query: vi.fn(),
			release: vi.fn()
		};
		// Simulate starting a transaction
		await mockClient.query('BEGIN');
		try {
			const result = await callback(mockClient);
			// Simulate committing the transaction
			await mockClient.query('COMMIT');
			return result;
		} catch (error) {
			// Simulate rolling back the transaction
			await mockClient.query('ROLLBACK');
			throw error;
		}
	})
};

export default db;

// Also export individual mocks if tests import them namedly (though default is preferred)
export const query = db.query;
export const getClient = db.getClient;
export const kyselyDb = db.kyselyDb;
export const transaction = db.transaction;
