
import { query } from '../database/db';

async function migrate() {
    try {
        console.log('Running migration...');

        // Add user_name column
        await query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='user_name') THEN 
                    ALTER TABLE users ADD COLUMN user_name VARCHAR(255); 
                END IF; 
            END $$;
        `);
        console.log('Added user_name column.');

        // Add role column
        await query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN 
                    ALTER TABLE users ADD COLUMN role VARCHAR(20) CHECK (role IN ('user', 'admin')) DEFAULT 'user'; 
                END IF; 
            END $$;
        `);
        console.log('Added role column.');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
