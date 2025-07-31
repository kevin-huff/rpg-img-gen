const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Railway-aware database path
let dbPath = process.env.DB_PATH || './db/rpg.sqlite';

// For Railway, ensure we use the persistent volume
if (process.env.RAILWAY_ENVIRONMENT) {
  dbPath = '/app/data/rpg.sqlite';
} else if (process.env.NODE_ENV === 'production' && !process.env.DB_PATH) {
  dbPath = '/app/data/rpg.sqlite';
}

const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

let db;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }
  return db;
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    const tables = [
      // Scenes table
      `CREATE TABLE IF NOT EXISTS scenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Characters table
      `CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        appearance TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Events table
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        type TEXT DEFAULT 'action',
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Templates table
      `CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        template_text TEXT NOT NULL,
        scene_id INTEGER,
        character_ids TEXT,
        event_ids TEXT,
        ai_style TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scene_id) REFERENCES scenes (id)
      )`,
      
      // Images table
      `CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT,
        url TEXT NOT NULL,
        template_id INTEGER,
        is_active BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES templates (id)
      )`,
      
      // Template usage tracking
      `CREATE TABLE IF NOT EXISTS template_scenes (
        template_id INTEGER,
        scene_id INTEGER,
        PRIMARY KEY (template_id, scene_id),
        FOREIGN KEY (template_id) REFERENCES templates (id),
        FOREIGN KEY (scene_id) REFERENCES scenes (id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS template_characters (
        template_id INTEGER,
        character_id INTEGER,
        PRIMARY KEY (template_id, character_id),
        FOREIGN KEY (template_id) REFERENCES templates (id),
        FOREIGN KEY (character_id) REFERENCES characters (id)
      )`
    ];
    
    let completed = 0;
    const total = tables.length;
    
    tables.forEach((sql) => {
      db.run(sql, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === total) {
          console.log('All database tables created successfully');
          resolve();
        }
      });
    });
  });
}

function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

module.exports = {
  getDatabase,
  initializeDatabase,
  closeDatabase
};
