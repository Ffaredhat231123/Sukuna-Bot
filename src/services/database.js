File: db.js
const Database = require('better-sqlite3');
const path = require('path');

// Ensure the database file is stored in a predictable location
const db = new Database(path.join(__dirname, 'warnings.sqlite'));

// Create table with extra metadata for better logging
db.prepare(`
    CREATE TABLE IF NOT EXISTS warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        warn_id TEXT NOT NULL UNIQUE,
        reason TEXT NOT NULL,
        moderator_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

module.exports = db;
