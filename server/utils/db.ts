import Database from 'better-sqlite3'
import { join } from 'path'

let _db: any = null

export const getDb = () => {
  if (!_db) {
    const dbPath = join(process.cwd(), 'ceka.db')
    _db = new Database(dbPath)
    
    // Create users table
    _db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        google_contacts_email TEXT,
        google_contacts_synced_at TEXT,
        created_at TEXT NOT NULL
      )
    `)

    // Create friends table
    _db.exec(`
      CREATE TABLE IF NOT EXISTS friends (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        avatar_bg TEXT,
        is_deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create sessions table
    _db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create bills table
    _db.exec(`
      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        people_count INTEGER NOT NULL,
        amount REAL NOT NULL,
        icon_type TEXT,
        icon_bg TEXT,
        raw_data TEXT NOT NULL,
        share_code TEXT UNIQUE,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create bill_payments table (checklist paid / unpaid)
    _db.exec(`
      CREATE TABLE IF NOT EXISTS bill_payments (
        id TEXT PRIMARY KEY,
        bill_id TEXT NOT NULL,
        friend_id TEXT NOT NULL,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        is_paid INTEGER NOT NULL DEFAULT 0,
        paid_at TEXT,
        FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
      )
    `)
  }
  return _db
}
