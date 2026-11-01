
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Create the energy readings table
const initializeDatabase = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS energy_readings (
                id BIGSERIAL PRIMARY KEY,
                electricity_usage_kwh DOUBLE PRECISION NOT NULL,
                estimated_bill_rupees DOUBLE PRECISION NOT NULL,
                solar_generation_kwh DOUBLE PRECISION NOT NULL,
                carbon_emissions_kg DOUBLE PRECISION NOT NULL,
                data_type TEXT NOT NULL DEFAULT 'simulated',
                recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('EcoNexa Neon PostgreSQL database connected.');
        console.log('Energy readings table is ready.');
    } catch (error) {
        console.error('Database initialization error:', error.message);
        throw error;
    }
};

module.exports = {
    pool,
    initializeDatabase
};
