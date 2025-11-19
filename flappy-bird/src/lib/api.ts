const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface GameState {
    cumulative_usd: number;
    next_threshold_usd: number;
    last_events: any[];
}

export interface LeaderboardEntry {
    wallet_address: string;
    display_name: string | null;
    high_score: number;
}

export interface PayoutEntry {
    amount_usd: number;
    amount_sol: number;
    tx_sig: string | null;
    created_at: string;
    wallet_address: string;
    display_name: string | null;
}

export const api = {
    async fetchState(): Promise<GameState> {
        try {
            const res = await fetch(`${API_URL}/v1/state`);
            if (!res.ok) throw new Error('Failed to fetch state');
            return await res.json();
        } catch (error) {
            console.error('Error fetching state:', error);
            // Return default state on error to prevent crash
            return { cumulative_usd: 0, next_threshold_usd: 500, last_events: [] };
        }
    },

    async submitScore(score: number, walletAddress: string, sessionId?: string) {
        try {
            const res = await fetch(`${API_URL}/v1/scores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_wallet: walletAddress,
                    score,
                    session_id: sessionId,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to submit score');
            }
            return await res.json();
        } catch (error) {
            console.error('Error submitting score:', error);
            throw error;
        }
    },

    async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
        try {
            const res = await fetch(`${API_URL}/v1/leaderboard`);
            if (!res.ok) throw new Error('Failed to fetch leaderboard');
            return await res.json();
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    },

    async fetchPayouts(): Promise<PayoutEntry[]> {
        try {
            const res = await fetch(`${API_URL}/v1/payouts`);
            if (!res.ok) throw new Error('Failed to fetch payouts');
            return await res.json();
        } catch (error) {
            console.error('Error fetching payouts:', error);
            return [];
        }
    },
};
