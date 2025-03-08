import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Initialize database
const initDb = async () => {
  try {
    console.log('Checking database connection...');
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

initDb().catch(console.error);

export default db;