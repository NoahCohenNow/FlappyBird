"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function initDb() {
    try {
        const schemaPath = path_1.default.join(__dirname, '../src/db/schema.sql');
        const schemaSql = fs_1.default.readFileSync(schemaPath, 'utf8');
        console.log('Connecting to database...');
        const client = await db_1.pool.connect();
        console.log('Connected! Executing schema...');
        try {
            await client.query(schemaSql);
            console.log('Schema executed successfully!');
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
    finally {
        await db_1.pool.end();
    }
}
initDb();
//# sourceMappingURL=init-db.js.map