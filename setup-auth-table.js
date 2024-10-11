import { sql } from '@vercel/postgres';
import { createTable } from '@auth/pg-adapter';

async function setup() {
  try {
    await sql.query(createTable);
    console.log('Auth tables created successfully');
  } catch (error) {
    console.error('Error creating Auth tables:', error);
  } finally {
    await sql.end();
  }
}

setup();