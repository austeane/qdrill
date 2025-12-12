import { vi } from 'vitest';

// Legacy pg-style exports still used in some route tests
const mockQuery = vi.fn();
const mockClientQuery = vi.fn();
const mockClient = {
	query: mockClientQuery,
	release: vi.fn()
};

export const query = mockQuery;
export const getClient = vi.fn().mockResolvedValue(mockClient);
export const end = vi.fn();
export const cleanup = vi.fn();

// Minimal Kysely-like mock used by services
const resultsQueue = [];

function nextResult(fallback) {
	if (resultsQueue.length === 0) return fallback;
	return resultsQueue.shift();
}

function createBuilder() {
	const builder = {
		selectFrom: vi.fn(() => builder),
		insertInto: vi.fn(() => builder),
		updateTable: vi.fn(() => builder),
		deleteFrom: vi.fn(() => builder),
		select: vi.fn(() => builder),
		selectAll: vi.fn(() => builder),
		leftJoin: vi.fn(() => builder),
		innerJoin: vi.fn(() => builder),
		where: vi.fn(() => builder),
		whereRef: vi.fn(() => builder),
		groupBy: vi.fn(() => builder),
		having: vi.fn(() => builder),
		orderBy: vi.fn(() => builder),
		limit: vi.fn(() => builder),
		offset: vi.fn(() => builder),
		distinctOn: vi.fn(() => builder),
		clearSelect: vi.fn(() => builder),
		clearOrderBy: vi.fn(() => builder),
		returning: vi.fn(() => builder),
		returningAll: vi.fn(() => builder),
		values: vi.fn(() => builder),
		set: vi.fn(() => builder),
		// Conflict helpers: accept callback shape, no-op.
		onConflict: vi.fn((cb) => {
			if (typeof cb === 'function') {
				cb({
					column: () => ({
						doUpdateSet: () => builder,
						doNothing: () => builder
					}),
					columns: () => ({
						doUpdateSet: () => builder,
						doNothing: () => builder
					})
				});
			}
			return builder;
		}),
		clone: vi.fn(() => builder),
		execute: vi.fn(async () => nextResult([])),
		executeTakeFirst: vi.fn(async () => nextResult(undefined)),
		executeTakeFirstOrThrow: vi.fn(async () => {
			const res = nextResult(undefined);
			if (!res) throw new Error('Not found');
			return res;
		})
	};
	return builder;
}

const baseBuilder = createBuilder();

export const kyselyDb = {
	...baseBuilder,
	fn: {
		countAll: vi.fn(() => ({ as: vi.fn() })),
		count: vi.fn(() => ({
			as: vi.fn(),
			distinct: vi.fn(() => ({ as: vi.fn() }))
		}))
	},
	transaction: vi.fn(() => ({
		execute: vi.fn(async (cb) => cb(kyselyDb))
	})),
	executeQuery: vi.fn(async () => nextResult({ rows: [] })),
	__pushResult: (res) => resultsQueue.push(res),
	__setResults: (arr) => {
		resultsQueue.length = 0;
		resultsQueue.push(...arr);
	},
	__reset: () => {
		resultsQueue.length = 0;
		vi.clearAllMocks();
	}
};

// Lightweight `sql` tag mock. In real Kysely this returns a RawBuilder that
// can be used inside queries, or executed directly via `.execute(trx)`.
export function sql(strings, ...values) {
	const payload = { strings, values };
	return {
		...payload,
		as: vi.fn((alias) => ({ ...payload, alias })),
		execute: vi.fn(async (executor) => {
			const provider = executor?.executeQuery ? executor : kyselyDb;
			return provider.executeQuery(payload);
		})
	};
}

sql.ref = vi.fn((column) => ({ ref: column }));
sql.raw = vi.fn((text) => ({ raw: text }));

export const vercelPool = { query: mockQuery, connect: vi.fn().mockResolvedValue(mockClient) };
export const transaction = kyselyDb.transaction;
