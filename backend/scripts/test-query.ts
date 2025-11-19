import { query, pool } from '../src/db';

async function test() {
    try {
        console.log('Testing fee_aggregate query...');
        const aggRes = await query('SELECT cumulative_usd FROM fee_aggregate LIMIT 1');
        console.log('fee_aggregate result:', aggRes.rows);

        console.log('Testing game_events query...');
        const eventsRes = await query('SELECT * FROM game_events ORDER BY triggered_at DESC LIMIT 5');
        console.log('game_events result:', eventsRes.rows);

        console.log('All queries successful.');
    } catch (err) {
        console.error('Query failed:', err);
    } finally {
        await pool.end();
    }
}

test();
