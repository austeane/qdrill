/* global vi */
// Mock for database operations
const mockQuery = vi.fn();
const mockClientQuery = vi.fn();
const mockClient = {
	query: mockClientQuery,
	release: vi.fn()
};

// Mock getPool function
const getPool = vi.fn(() => ({
	connect: vi.fn().mockResolvedValue(mockClient)
}));

export const query = mockQuery;

export const getClient = vi.fn().mockResolvedValue(mockClient);

export const transaction = vi.fn();

export const end = vi.fn();

export const cleanup = vi.fn();
