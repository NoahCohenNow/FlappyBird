import axios from 'axios';

export class PriceService {
  private static cache: { price: number; timestamp: number } | null = null;
  private static CACHE_TTL = 10000; // 10 seconds

  // Fallback to CoinGecko if Pyth is complex to set up quickly without on-chain connection code
  static async getSolPriceInUsd(): Promise<number> {
    const now = Date.now();
    if (this.cache && now - this.cache.timestamp < this.CACHE_TTL) {
      return this.cache.price;
    }

    try {
      // Primary: CoinGecko (Simple and free for low volume)
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
      );
      const price = response.data.solana.usd;
      this.cache = { price, timestamp: now };
      return price;
    } catch (error) {
      console.error('Error fetching price from CoinGecko:', error);
      
      // Fallback or return last cached value if available
      if (this.cache) {
          console.warn('Returning stale price cache');
          return this.cache.price;
      }
      
      throw new Error('Failed to fetch SOL price and no cache available');
    }
  }
}
