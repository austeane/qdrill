// Mock for database operations
const mockQuery = vi.fn();
const mockTransaction = vi.fn();
const mockClient = {
  query: mockQuery,
  release: vi.fn()
};

const db = {
  query: mockQuery,
  getClient: vi.fn().mockResolvedValue(mockClient),
  transaction: mockTransaction
};

export default db;
export { mockQuery, mockClient, mockTransaction };