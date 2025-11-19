import { pool } from '../src/db';
import fs from 'fs';
import path from 'path';

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, '../src/db/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Connecting to database...');
        const client = await pool.connect();
        console.log('Connected! Executing schema...');

        try {
            await client.query(schemaSql);
            console.log('Schema executed successfully!');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initDb();
