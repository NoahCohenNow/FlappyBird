import { query } from '../db';
import { PriceService } from './PriceService';
import { Queue, Worker } from 'bullmq';
// In a real implementation, you would import Keypair/Transaction from @solana/web3.js
// and likely use a secure vault or KMS to sign.

export const payoutQueue = new Queue('execute-payout', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    }
});

export class PayoutService {
    private worker: Worker;
    
    constructor() {
        this.worker = new Worker('execute-payout', async job => {
            if (job.name === 'process-payout') {
                await this.processPayout(job.data.payoutId);
            }
        }, {
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
            }
        });
    }

    // This would typically be called by a Cron job
    static async calculateDailyPayouts() {
        console.log('Calculating daily payouts...');
        
        // 1. Determine pool (e.g., 30% of total fee aggregate current value or strictly tracked available fees)
        // For simplicity, let's say we take 30% of the CURRENT cumulative_usd for the payout pool
        // NOTE: This is a design choice. You might want to track a separate 'rewards_pool' in DB.
        const aggRes = await query('SELECT cumulative_usd FROM fee_aggregate LIMIT 1');
        if (aggRes.rows.length === 0) return;
        
        const currentPool = parseFloat(aggRes.rows[0].cumulative_usd);
        if (currentPool <= 0) {
            console.log('No funds in pool');
            return;
        }

        const DAILY_PAYOUT_PERCENT = 0.30;
        const payoutPoolUsd = currentPool * DAILY_PAYOUT_PERCENT;
        
        // 2. Get Top Players (Yesterday's activity usually, but here strictly top scores)
        // Better: Get top scores created in last 24h
        const topPlayersRes = await query(`
            SELECT p.id as player_id, MAX(s.score) as daily_score
            FROM scores s
            JOIN players p ON s.player_id = p.id
            WHERE s.created_at > NOW() - INTERVAL '24 hours'
            GROUP BY p.id
            ORDER BY daily_score DESC
            LIMIT 10
        `);
        
        const topPlayers = topPlayersRes.rows;
        if (topPlayers.length === 0) return;

        const totalScore = topPlayers.reduce((sum, p) => sum + p.daily_score, 0);
        const solPrice = await PriceService.getSolPriceInUsd();

        for (const player of topPlayers) {
            // Proportional share
            const shareUsd = (player.daily_score / totalScore) * payoutPoolUsd;
            const shareSol = shareUsd / solPrice;

            // Create Payout Record
            const payoutRes = await query(
                `INSERT INTO payouts (player_id, amount_usd, amount_sol, status)
                 VALUES ($1, $2, $3, 'PENDING') RETURNING id`,
                [player.player_id, shareUsd, shareSol]
            );

            // Queue Job
            await payoutQueue.add('process-payout', { payoutId: payoutRes.rows[0].id });
        }

        // Deduct from aggregate (so we don't pay out same money twice)
        await query('UPDATE fee_aggregate SET cumulative_usd = cumulative_usd - $1', [payoutPoolUsd]);
        
        console.log(`Created payouts for ${topPlayers.length} players totaling $${payoutPoolUsd}`);
    }

    async processPayout(payoutId: string) {
        console.log(`Processing payout ${payoutId}`);
        
        const res = await query('SELECT * FROM payouts WHERE id = $1', [payoutId]);
        const payout = res.rows[0];
        
        if (payout.status !== 'PENDING') return;

        try {
            // REAL LOGIC:
            // 1. Get player wallet address
            // 2. Construct SOL transfer transaction
            // 3. Sign with Treasury Keypair
            // 4. Send and Confirm

            // MOCK LOGIC:
            const txSig = 'mock_sig_' + Date.now(); // Simulate successful tx
            console.log(`Sending ${payout.amount_sol} SOL to player... (Mock)`);
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network

            await query(
                `UPDATE payouts SET status = 'SENT', tx_sig = $1, updated_at = NOW() WHERE id = $2`,
                [txSig, payoutId]
            );
            console.log(`Payout ${payoutId} complete: ${txSig}`);

        } catch (error) {
            console.error(`Payout failed for ${payoutId}`, error);
            await query(
                `UPDATE payouts SET status = 'FAILED', attempt_count = attempt_count + 1 WHERE id = $1`,
                [payoutId]
            );
            // BullMQ will handle retries based on worker config
            throw error;
        }
    }
}
