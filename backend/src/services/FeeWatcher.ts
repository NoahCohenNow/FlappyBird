import { Connection, PublicKey } from '@solana/web3.js';
import { query } from '../db';
import { PriceService } from './PriceService';
import { EventManager } from './EventManager';

export class FeeWatcher {
  private connection: Connection;
  private creatorWallet: PublicKey;
  private isRunning: boolean = false;

  constructor(rpcUrl: string, creatorWalletAddress: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.creatorWallet = new PublicKey(creatorWalletAddress);
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`Starting FeeWatcher for wallet: ${this.creatorWallet.toBase58()}`);

    // Subscribe to account changes (simplified for demo, production might use Helius webhooks)
    this.connection.onAccountChange(
      this.creatorWallet,
      async (accountInfo, context) => {
        // Note: This is a simplified trigger. In a real production system, 
        // you would parse transaction history to find the specific transfer amount 
        // that caused this change to handle it idempotently.
        // For this implementation, we'll assume we poll recent signatures or use a webhook.
        // Here we trigger a check of recent signatures.
        await this.checkRecentTransactions();
      },
      'confirmed'
    );

    // Initial check
    await this.checkRecentTransactions();
  }

  private async checkRecentTransactions() {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        this.creatorWallet,
        { limit: 10 }
      );

      for (const sigInfo of signatures) {
        // Check if processed
        const exists = await query('SELECT 1 FROM fee_events WHERE tx_sig = $1', [sigInfo.signature]);
        if (exists.rows.length > 0) continue;

        // Fetch tx details
        const tx = await this.connection.getParsedTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0
        });

        if (!tx || !tx.meta || tx.meta.err) continue;

        // Extract SOL transfer amount to creator wallet
        // This logic needs to be precise based on instruction type. 
        // We look for balance changes for simplicity in this demo.
        const preBalance = tx.meta.preBalances[0]; // Assuming payer is index 0, simplified
        const postBalance = tx.meta.postBalances[0];

        // Better approach: Look at postTokenBalances or native balance changes for our specific wallet
        const accountIndex = tx.transaction.message.accountKeys.findIndex(
          k => k.pubkey.toString() === this.creatorWallet.toString()
        );

        if (accountIndex === -1) continue;

        const pre = tx.meta.preBalances[accountIndex];
        const post = tx.meta.postBalances[accountIndex];

        if (pre === undefined || post === undefined) continue;

        const amountLamports = post - pre;

        if (amountLamports <= 0) continue; // Not a deposit

        const amountSol = amountLamports / 1_000_000_000;
        const solPrice = await PriceService.getSolPriceInUsd();
        const amountUsd = amountSol * solPrice;

        console.log(`Detected deposit: ${amountSol} SOL ($${amountUsd}) in tx ${sigInfo.signature}`);

        // Record Event
        await query(
          `INSERT INTO fee_events (tx_sig, amount_raw, amount_native, amount_usd, processed)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (tx_sig) DO NOTHING`,
          [sigInfo.signature, amountLamports, amountSol, amountUsd, true]
        );

        // Update Aggregate
        await query(
          `INSERT INTO fee_aggregate (cumulative_usd) VALUES ($1) 
             ON CONFLICT (id) DO UPDATE SET cumulative_usd = fee_aggregate.cumulative_usd + $1`,
          [amountUsd]
          // Note: In reality, we'd link to a specific creator_wallet_id. 
          // For single-tenant demo, we might just have one row or update the first one.
        );

        // Fix for demo: Update the single aggregate row
        await query(
          `UPDATE fee_aggregate SET cumulative_usd = cumulative_usd + $1 WHERE id = (SELECT id FROM fee_aggregate LIMIT 1)`,
          [amountUsd]
        );

        // Retrieve the aggregate ID to pass to the job
        const aggResult = await query('SELECT id FROM fee_aggregate LIMIT 1');
        if (aggResult.rows.length > 0) {
          // Direct call instead of queue
          await EventManager.checkThreshold(aggResult.rows[0].id);
        }
        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      console.error('Error checking transactions:', err);
    }
  }
}
