import { query } from '../db';
import { PriceService } from './PriceService';
import { Keypair, Transaction, SystemProgram, sendAndConfirmTransaction, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

export class PayoutService {
    private connection: Connection;

    constructor() {
        this.connection = new Connection(process.env.RPC_URL || 'https://api.mainnet-beta.solana.com', 'confirmed');
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

            // Process Payout Directly
            // Note: In a real app, we might want to use setImmediate or a simple in-memory queue
            // to avoid blocking the loop if there are many payouts.
            const payoutId = payoutRes.rows[0].id;

            // Async call without awaiting to not block the loop
            new PayoutService().processPayout(payoutId).catch(console.error);
        }

        // Deduct from aggregate (so we don't pay out same money twice)
        await query('UPDATE fee_aggregate SET cumulative_usd = cumulative_usd - $1', [payoutPoolUsd]);

        console.log(`Created payouts for ${topPlayers.length} players totaling $${payoutPoolUsd}`);
    }

    async processPayout(payoutId: string) {
        console.log(`Processing payout ${payoutId}`);

        const res = await query(`
            SELECT p.*, pl.wallet_address 
            FROM payouts p 
            JOIN players pl ON p.player_id = pl.id 
            WHERE p.id = $1
        `, [payoutId]);
        const payout = res.rows[0];

        if (payout.status !== 'PENDING') return;

        try {
            // REAL LOGIC:
            // 1. Get player wallet address
            // 2. Construct SOL transfer transaction
            // 3. Sign with Treasury Keypair
            const privateKeyString = process.env.CREATOR_PRIVATE_KEY;
            if (!privateKeyString || privateKeyString === 'YOUR_PRIVATE_KEY_HERE') {
                throw new Error('CREATOR_PRIVATE_KEY not set');
            }

            // Decode private key (assuming base58)
            const secretKey = bs58.decode(privateKeyString);
            const keypair = Keypair.fromSecretKey(secretKey);

            // 4. Send and Confirm
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: keypair.publicKey,
                    toPubkey: new PublicKey(payout.wallet_address), // Assuming we join players table to get this
                    lamports: BigInt(Math.floor(payout.amount_sol * 1_000_000_000)),
                })
            );

            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [keypair]
            );

            console.log(`Payout ${payoutId} complete: ${signature}`);

            await query(
                `UPDATE payouts SET status = 'SENT', tx_sig = $1, updated_at = NOW() WHERE id = $2`,
                [signature, payoutId]
            );

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
