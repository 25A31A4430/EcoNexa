
const app = require('../backend/server');
const { initializeDatabase } = require('../backend/database');

let databaseReady;

module.exports = async (req, res) => {
    try {
        if (!databaseReady) {
            databaseReady = initializeDatabase();
        }

        await databaseReady;
        return app(req, res);
    } catch (error) {
        console.error('EcoNexa initialization error:', error);

        databaseReady = null;

        return res.status(500).json({
            error: 'EcoNexa server initialization failed.'
        });
    }
};
