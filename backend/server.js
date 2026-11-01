
require('dotenv').config();

const express = require('express');
const path = require('path');
const { pool, initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.url);
    next();
});

// Serve the EcoNexa website
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Backend health check
app.get('/api/status', (req, res) => {
    res.json({
        project: 'EcoNexa',
        status: 'running',
        message: 'EcoNexa energy platform is ready!'
    });
});

// Temporary POST route test
app.post('/api/test-post', (req, res) => {
    res.json({ message: 'POST route works!' });
});

// Save an energy reading to Neon PostgreSQL
app.post('/api/energy-readings', async (req, res) => {
    const {
        electricityUsageKwh,
        electricityRateRupeesPerKwh,
        solarGenerationKwh
    } = req.body;

    const values = [
        electricityUsageKwh,
        electricityRateRupeesPerKwh,
        solarGenerationKwh
    ];

    if (
        values.some(value =>
            typeof value !== 'number' ||
            !Number.isFinite(value) ||
            value < 0
        )
    ) {
        return res.status(400).json({
            error: 'Provide valid non-negative numeric readings.'
        });
    }

    const estimatedBillRupees = Number(
        (electricityUsageKwh * electricityRateRupeesPerKwh).toFixed(2)
    );

    const carbonEmissionsKg = Number(
        (electricityUsageKwh * 0.57).toFixed(2)
    );

    try {
        const result = await pool.query(
            `INSERT INTO energy_readings (
                electricity_usage_kwh,
                estimated_bill_rupees,
                solar_generation_kwh,
                carbon_emissions_kg,
                data_type
            ) VALUES ($1, $2, $3, $4, 'simulated')
            RETURNING id`,
            [
                electricityUsageKwh,
                estimatedBillRupees,
                solarGenerationKwh,
                carbonEmissionsKg
            ]
        );

        res.status(201).json({
            message: 'Energy reading saved to Neon PostgreSQL.',
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('Database insert error:', error.message);
        res.status(500).json({
            error: 'Could not save energy reading.'
        });
    }
});

// Get the latest saved reading, or demo values if the database is empty
app.get('/api/energy-readings', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM energy_readings
            ORDER BY id DESC
            LIMIT 1
        `);

        const reading = result.rows[0];

        if (!reading) {
            return res.json({
                project: 'EcoNexa',
                dataType: 'simulated',
                isLive: false,
                readings: {
                    electricityUsageKwh: 248.6,
                    estimatedBillRupees: 1864.5,
                    electricityRateRupeesPerKwh: 7.5,
                    solarGenerationKwh: 86.2,
                    carbonEmissionsKg: 141.7
                },
                message: 'Demo values only. No readings have been saved yet.'
            });
        }

        const usage = Number(reading.electricity_usage_kwh);

        res.json({
            project: 'EcoNexa',
            dataType: reading.data_type,
            isLive: false,
            timestamp: reading.recorded_at,
            readings: {
                electricityUsageKwh: usage,
                estimatedBillRupees: Number(reading.estimated_bill_rupees),
                electricityRateRupeesPerKwh:
                    usage > 0
                        ? Number((Number(reading.estimated_bill_rupees) / usage).toFixed(2))
                        : 0,
                solarGenerationKwh: Number(reading.solar_generation_kwh),
                carbonEmissionsKg: Number(reading.carbon_emissions_kg)
            },
            message: 'Reading retrieved from the EcoNexa Neon PostgreSQL database.'
        });
    } catch (error) {
        console.error('Database read error:', error.message);
        res.status(500).json({
            error: 'Could not read energy readings.'
        });
    }
});

// View recent readings saved in PostgreSQL
app.get('/api/energy-history', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM energy_readings
            ORDER BY id DESC
            LIMIT 50
        `);

        res.json({
            count: result.rows.length,
            readings: result.rows
        });
    } catch (error) {
        console.error('History query error:', error.message);
        res.status(500).json({
            error: 'Could not load energy history.'
        });
    }
});

// Start locally after initializing the database
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            app.listen(PORT, () => {
                console.log('EcoNexa Neon PostgreSQL server started.');
                console.log(`EcoNexa is running at http://localhost:${PORT}`);
            });
        })
        .catch(error => {
            console.error('Could not start EcoNexa:', error.message);
            process.exit(1);
        });
}

module.exports = app;
