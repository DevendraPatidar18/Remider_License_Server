

import fs from 'fs';
import path from 'path';
import pool from '../database/db';

const initDb = async () => {
    try {
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema...');
        await pool.query(schema);
        console.log('Schema executed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error executing schema:', error);
        process.exit(1);
    }
};

initDb();
