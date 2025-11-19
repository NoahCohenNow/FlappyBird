import { query } from '../db';
import { z } from 'zod';

const ScoreSchema = z.object({
  player_wallet: z.string(),
  score: z.number().int().positive(),
  session_id: z.string().optional(),
});

export class ScoreService {
  static async submitScore(data: any) {
    const validated = ScoreSchema.parse(data);
    
    // Ensure player exists
    let playerId;
    const playerRes = await query('SELECT id FROM players WHERE wallet_address = $1', [validated.player_wallet]);
    
    if (playerRes.rows.length > 0) {
        playerId = playerRes.rows[0].id;
    } else {
        const newPlayer = await query(
            'INSERT INTO players (wallet_address) VALUES ($1) RETURNING id',
            [validated.player_wallet]
        );
        playerId = newPlayer.rows[0].id;
    }

    // Insert Score
    await query(
        'INSERT INTO scores (player_id, score, game_session_id) VALUES ($1, $2, $3)',
        [playerId, validated.score, validated.session_id]
    );

    return { success: true, playerId };
  }

  static async getLeaderboard(limit = 10) {
      // Simple all-time or daily high score logic
      const res = await query(`
        SELECT p.wallet_address, p.display_name, MAX(s.score) as high_score
        FROM scores s
        JOIN players p ON s.player_id = p.id
        GROUP BY p.id
        ORDER BY high_score DESC
        LIMIT $1
      `, [limit]);
      
      return res.rows;
  }
}
