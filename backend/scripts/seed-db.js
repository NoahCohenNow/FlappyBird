"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/db");
async function seed() {
    try {
        console.log('Seeding database...');
        // 1. Create Creator Wallet
        const walletRes = await db_1.pool.query(`
            INSERT INTO creator_wallets (address, currency, decimals)
            VALUES ($1, $2, $3)
            ON CONFLICT (address) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
            RETURNING id
        `, ['11111111111111111111111111111111', 'SOL', 9]);
        const walletId = walletRes.rows[0].id;
        console.log('Creator Wallet ID:', walletId);
        // 2. Create Fee Aggregate
        await db_1.pool.query(`
            INSERT INTO fee_aggregate (creator_wallet_id, cumulative_usd)
            VALUES ($1, 0)
            ON CONFLICT DO NOTHING
        `, [walletId]);
        console.log('Fee Aggregate initialized.');
        console.log('Seeding complete.');
    }
    catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
    finally {
        await db_1.pool.end();
    }
}
seed();
//# sourceMappingURL=seed-db.js.map