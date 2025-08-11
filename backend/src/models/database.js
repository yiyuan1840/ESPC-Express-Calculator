// Database setup and initialization
// import Database from 'better-sqlite3';
// import path from 'path';
// import { fileURLToPath } from 'url';

// Temporarily use mock database for testing when SQLite build tools are not available
import mockDb, { initializeDatabase as initMockDatabase } from './database-mock.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Create database connection
// const db = new Database(path.join(__dirname, '../../espc.db'));
const db = mockDb;

// Initialize database tables
export function initializeDatabase() {
  // Use mock database initialization
  initMockDatabase();
}

// Note: seedDefaultECMs function moved to database-mock.js

export default db;