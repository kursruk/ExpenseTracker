import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "./db/schema";
import { initializeDatabase } from './db/init';

// Initialize SQLite database
const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
async function createTables() {
  try {
    console.log('Starting database initialization...');

    // Create roles table first (as it's referenced by users)
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )
    `);

    console.log('Roles table created');

    // Create users table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        company TEXT,
        role_id TEXT NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);

    console.log('Users table created');

    // Create shops table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS shops (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);

    // Create checks table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS checks (
        id TEXT PRIMARY KEY,
        check_number INTEGER NOT NULL,
        date TEXT NOT NULL,
        shop_id TEXT NOT NULL,
        total REAL NOT NULL DEFAULT 0,
        FOREIGN KEY (shop_id) REFERENCES shops(id)
      )
    `);

    // Create check_items table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS check_items (
        id TEXT PRIMARY KEY,
        check_id TEXT NOT NULL,
        serial_number INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        price REAL NOT NULL,
        count REAL NOT NULL,
        unit_of_measure TEXT NOT NULL,
        total REAL NOT NULL,
        FOREIGN KEY (check_id) REFERENCES checks(id)
      )
    `);

    console.log('All tables created successfully');

    // Initialize roles and admin user
    await initializeDatabase();
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
}

// Initialize database
createTables().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

export default db;