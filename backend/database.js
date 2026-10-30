
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Locate the project's database folder
const databaseFolder = path.join(__dirname, '..', 'database');

// Create the folder if it doesn't exist
fs.mkdirSync(databaseFolder, { recursive: true });

// Create or open the SQLite database file
const databasePath = path.join(databaseFolder, 'econexa.db');
const db = new Database(databasePath);

// Create a table for energy readings
db.exec(`
    CREATE TABLE IF NOT EXISTS energy_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        electricity_usage_kwh REAL NOT NULL,
        estimated_bill_rupees REAL NOT NULL,
        solar_generation_kwh REAL NOT NULL,
        carbon_emissions_kg REAL NOT NULL,
        data_type TEXT NOT NULL DEFAULT 'simulated',
        recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
`);

console.log('EcoNexa SQLite database connected.');
console.log('Energy readings table is ready.');

module.exports = db;