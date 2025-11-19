import { query } from '../db';

const THRESHOLD_USD = 500;
const MEGA_GREEN_CANDLE_DURATION = 60; // seconds
const MULTIPLIER = 5;

export class EventManager {

    constructor() {
    }

    static async checkThreshold(aggregateId: string) {
        console.log(`Evaluating threshold for aggregate ${aggregateId}`);

        try {
            const res = await query('SELECT cumulative_usd FROM fee_aggregate WHERE id = $1', [aggregateId]);
            if (res.rows.length === 0) return;

            let cumulativeUsd = parseFloat(res.rows[0].cumulative_usd);

            // Check if threshold met
            while (cumulativeUsd >= THRESHOLD_USD) {
                console.log(`Threshold met! ($${cumulativeUsd} >= $${THRESHOLD_USD})`);

                // Trigger Event
                const eventPayload = {
                    multiplier: MULTIPLIER,
                    duration_seconds: MEGA_GREEN_CANDLE_DURATION,
                    triggered_by: 'THRESHOLD',
                    threshold: THRESHOLD_USD
                };

                // 1. Record Game Event
                const eventRes = await query(
                    `INSERT INTO game_events (type, params, amount_usd_consumed) 
                 VALUES ($1, $2, $3) RETURNING id, triggered_at`,
                    ['MEGA_GREEN_CANDLE', JSON.stringify(eventPayload), THRESHOLD_USD]
                );

                // 2. Publish to WebSocket/Redis PubSub (REMOVED for simplicity, use polling or SSE later)
                /*
                const eventData = {
                    event: 'MEGA_GREEN_CANDLE',
                    ...eventPayload,
                    id: eventRes.rows[0].id,
                    timestamp: eventRes.rows[0].triggered_at
                };
                await redis.publish('game-events', JSON.stringify(eventData));
                */

                // 3. Deduct from Aggregate
                await query(
                    `UPDATE fee_aggregate SET cumulative_usd = cumulative_usd - $1 WHERE id = $2`,
                    [THRESHOLD_USD, aggregateId]
                );

                cumulativeUsd -= THRESHOLD_USD;
                console.log(`Event triggered! Remaining cumulative: ${cumulativeUsd}`);
            }
        } catch (err) {
            console.error('Error in checkThreshold:', err);
            throw err;
        }
    }
}
