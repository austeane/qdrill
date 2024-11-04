import { createClient } from '@vercel/postgres';

export const db = {
  async query(text, params) {
    const client = createClient();
    await client.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      await client.end();
    }
  }
};