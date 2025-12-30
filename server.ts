import app from './app';
import { config } from './config';
import pool from './database/db';

const startServer = async () => {
    try {
        // Test DB Connection
        await pool.query('SELECT 1');
        console.log('Database connected successfully.');

        app.listen(config.port, () => {
            console.log(`Server running in ${config.env} mode on port ${config.port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
