import express from 'express';
import cors from 'cors';
import { query } from './db';
import { ScoreService } from './services/ScoreService';
import { FeeWatcher } from './services/FeeWatcher';
import { EventManager } from './services/EventManager';
import { PayoutService } from './services/PayoutService';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Initialize Services
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com';
const CREATOR_WALLET = process.env.CREATOR_WALLET || '11111111111111111111111111111111'; // Replace with real wallet

const feeWatcher = new FeeWatcher(RPC_URL, CREATOR_WALLET);
const eventManager = new EventManager();
const payoutService = new PayoutService(); // Starts the worker

// Start background tasks
feeWatcher.start().catch(console.error);

// --- API Endpoints ---

// GET /v1/state
app.get('/v1/state', async (req, res) => {
  try {
    const aggRes = await query('SELECT cumulative_usd FROM fee_aggregate LIMIT 1');
    const cumulativeUsd = aggRes.rows.length ? parseFloat(aggRes.rows[0].cumulative_usd) : 0;
    
    const eventsRes = await query('SELECT * FROM game_events ORDER BY triggered_at DESC LIMIT 5');
    
    res.json({
      cumulative_usd: cumulativeUsd,
      next_threshold_usd: 500 - (cumulativeUsd % 500), // Simple calc for next milestone
      last_events: eventsRes.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /v1/scores
app.post('/v1/scores', async (req, res) => {
  try {
    const result = await ScoreService.submitScore(req.body);
    res.json(result);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// GET /v1/leaderboard
app.get('/v1/leaderboard', async (req, res) => {
    try {
        const leaderboard = await ScoreService.getLeaderboard();
        res.json(leaderboard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ADMIN: Trigger Daily Payout (Manually for demo)
app.post('/v1/admin/trigger-payout', async (req, res) => {
    // In prod: Check Admin Secret Header
    try {
        await PayoutService.calculateDailyPayouts();
        res.json({ success: true, message: 'Payout calculation triggered' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to trigger payouts' });
    }
});

app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
