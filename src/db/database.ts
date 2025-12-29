import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'dice-game.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db: DatabaseType = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
  `);

  // Games table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      player1_id TEXT NOT NULL,
      player1_username TEXT NOT NULL,
      player2_id TEXT NOT NULL,
      player2_username TEXT NOT NULL,
      current_player_id TEXT NOT NULL,
      player1_score INTEGER NOT NULL DEFAULT 0,
      player2_score INTEGER NOT NULL DEFAULT 0,
      player1_round_score INTEGER NOT NULL DEFAULT 0,
      player2_round_score INTEGER NOT NULL DEFAULT 0,
      winning_score INTEGER NOT NULL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'active',
      winner_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_games_player1 ON games(player1_id);
    CREATE INDEX IF NOT EXISTS idx_games_player2 ON games(player2_id);
    CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
  `);

  console.log('Database initialized successfully');
}

// Initialize on import
initializeDatabase();

export default db;

