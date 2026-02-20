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

function runStatement(dbInstance, sql) {
  return new Promise((resolve, reject) => {
    dbInstance.run(sql, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

function ensureColumn(dbInstance, tableName, columnName, definition) {
  return new Promise((resolve, reject) => {
    dbInstance.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
      if (err) {
        return reject(err);
      }

      const exists = columns.some((column) => column.name === columnName);
      if (exists) {
        return resolve(false);
      }

      dbInstance.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`, (alterErr) => {
        if (alterErr) {
          return reject(alterErr);
        }

        console.log(`Added column ${columnName} to ${tableName}`);
        resolve(true);
      });
    });
  });
}

async function runMigrations(dbInstance) {
  try {
    await ensureColumn(dbInstance, 'templates', 'event_ids', 'TEXT');
  } catch (err) {
    console.error('Error ensuring templates.event_ids column:', err.message);
    throw err;
  }

  try {
    await ensureColumn(dbInstance, 'templates', 'input_snapshot', 'TEXT');
  } catch (err) {
    console.error('Error ensuring templates.input_snapshot column:', err.message);
    throw err;
  }

  try {
    await ensureColumn(dbInstance, 'templates', 'style_profile_id', 'INTEGER');
  } catch (err) {
    console.error('Error ensuring templates.style_profile_id column:', err.message);
    throw err;
  }
}

async function initializeDatabase() {
  const dbInstance = getDatabase();

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
      input_snapshot TEXT,
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

    // Style profiles table
    `CREATE TABLE IF NOT EXISTS style_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      style_preset TEXT DEFAULT '',
      composition TEXT DEFAULT '',
      lighting TEXT DEFAULT '',
      mood TEXT DEFAULT '',
      camera TEXT DEFAULT '',
      post_processing TEXT DEFAULT '',
      ai_style TEXT DEFAULT '',
      is_default BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  try {
    await runStatement(dbInstance, 'PRAGMA foreign_keys = ON');

    for (const sql of tables) {
      await runStatement(dbInstance, sql);
    }

    await runMigrations(dbInstance);

    console.log('All database tables created successfully');
  } catch (err) {
    console.error('Error initializing database:', err.message);
    throw err;
  }
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
