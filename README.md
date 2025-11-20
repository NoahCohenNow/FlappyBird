# 🕹️ Flappy Candle - Crypto-Themed Flappy Bird Game

A Next.js-based Flappy Bird game with a crypto/trading twist, featuring Solana wallet integration, real-time leaderboards, and a creator fee reward system.

## 🎮 Game Overview

**Flappy Candle** is a browser-based arcade game where players control a green candlestick chart through obstacles labeled with crypto-themed FUD (Fear, Uncertainty, Doubt) terms. The game features:

- **Crypto-themed gameplay**: Navigate a candlestick through obstacles like "FUD", "SEC", "RUG", "DUMP", etc.
- **Creator Fees System**: Collect coins (Ξ) to fill up the creator fees bar
- **Moon Mode**: Activate "MEGA GREEN CANDLE" mode when fees reach threshold for invincibility and bonus points
- **Solana Wallet Integration**: Connect your wallet to track scores on the global leaderboard
- **Real-time Leaderboard**: Compete with other players worldwide
- **Payout History**: View recent payouts from the creator fee pool

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Blockchain**: Solana Web3.js with Wallet Adapter
- **Font**: VT323 (retro gaming aesthetic)

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Blockchain**: Solana Web3.js for transaction handling

## 📋 Prerequisites

- Node.js 18+ or compatible package manager (npm, pnpm, yarn)
- PostgreSQL database (Supabase recommended)
- Solana wallet for testing (Phantom, Solflare, etc.)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd game-logic
```

### 2. Frontend Setup

```bash
cd flappy-bird
npm install
# or
pnpm install
```

Create a `.env.local` file in the `flappy-bird` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Backend Setup

```bash
cd ../backend
npm install
# or
pnpm install
```

Create a `.env` file in the `backend` directory (see `.env.example`):

```env
PORT=3001
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
CREATOR_PRIVATE_KEY=your-solana-private-key-base58
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### 4. Database Initialization

Initialize and seed the database:

```bash
cd backend
npm run init-db    # Creates tables
npm run seed-db    # Seeds initial data (optional)
```

## 🎯 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd flappy-bird
npm run dev
# or
pnpm run dev
# App runs on http://localhost:3000
```

### Production Build

**Frontend:**
```bash
cd flappy-bird
npm run build
npm run start
```

**Backend:**
```bash
cd backend
npm run build
npm run start
```

## 🎮 How to Play

1. **Connect Wallet** (optional): Click the wallet button to connect your Solana wallet
2. **Start Game**: Click "MINT & START" or press Space/Arrow Up
3. **Controls**:
   - **Desktop**: Space, Arrow Up, or Click
   - **Mobile**: Tap screen
4. **Objective**: 
   - Navigate the green candlestick through gaps in obstacles
   - Collect golden coins (Ξ) to fill the creator fees bar
   - Reach 100% fees to activate Moon Mode for invincibility and bonus points
5. **Scoring**:
   - Pass obstacle: +10 points (normal) / +50 points (Moon Mode)
   - Avoid hitting obstacles or the ground
   - Beat your high score and climb the leaderboard!

## 📁 Project Structure

```
game-logic/
├── flappy-bird/              # Next.js Frontend
│   ├── src/
│   │   ├── app/              # Next.js app directory
│   │   │   ├── layout.tsx    # Root layout with wallet provider
│   │   │   └── page.tsx      # Main game page
│   │   ├── components/
│   │   │   └── Game.tsx      # Main game component with canvas logic
│   │   └── lib/
│   │       └── api.ts        # API client for backend communication
│   ├── public/               # Static assets
│   └── package.json
│
└── backend/                  # Express.js Backend
    ├── src/
    │   ├── server.ts         # Express server setup
    │   ├── api/              # API route handlers
    │   ├── db/               # Database connection and queries
    │   └── services/         # Business logic (blockchain, payouts, etc.)
    ├── scripts/
    │   ├── init-db.ts        # Database initialization
    │   └── seed-db.ts        # Database seeding
    └── package.json
```

## 🔌 API Endpoints

### `GET /v1/state`
Fetch current game state including cumulative USD and next threshold.

### `POST /v1/scores`
Submit a player's score.
```json
{
  "player_wallet": "wallet_address",
  "score": 1000,
  "session_id": "optional_session_id"
}
```

### `GET /v1/leaderboard`
Fetch top player scores.

### `GET /v1/payouts`
Fetch recent payout history.

## 🎨 Features

### Visual Effects
- Retro CRT scanline overlay
- Particle effects on jump and coin collection
- Glowing candlestick with dynamic trail
- Animated background grid and chart
- Smooth transitions and hover effects

### Game Mechanics
- **Gravity System**: Realistic physics for candlestick movement
- **Collision Detection**: Precise hitbox detection
- **Progressive Difficulty**: Speed increases during Moon Mode
- **Score Persistence**: High scores saved to localStorage and backend
- **Session Tracking**: Track individual game sessions

### Blockchain Integration
- Solana wallet connection via Wallet Adapter
- Score submission tied to wallet addresses
- Payout distribution system (backend)
- Transaction signing for rewards

## 🔧 Configuration

### Game Constants (in `Game.tsx`)
```typescript
GRAVITY = 0.25           // Falling speed acceleration
JUMP = -5.5              // Jump velocity
SPAWN_RATE = 140         // Frames between obstacles
GAP_SIZE = 170           // Vertical gap in obstacles
COIN_VALUE = 100         // Fee value per coin
MOON_THRESHOLD = 500     // Fees needed for Moon Mode
MOON_DURATION = 500      // Frames Moon Mode lasts
```

## 🚢 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL`
4. Deploy

### Backend (Railway/Render/Heroku)
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy backend service

## 🐛 Troubleshooting

### Game won't start
- Check browser console for errors
- Ensure backend is running on port 3001
- Verify API_URL in frontend .env.local

### Wallet won't connect
- Ensure you have a Solana wallet extension installed
- Check browser permissions
- Try refreshing the page

### Database errors
- Verify DATABASE_URL is correct
- Run `npm run init-db` to create tables
- Check PostgreSQL connection

## 📝 License

ISC

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

## 🎯 Future Enhancements

- [ ] Mobile-optimized controls
- [ ] Sound effects and background music
- [ ] Multiple difficulty levels
- [ ] Power-ups and special abilities
- [ ] NFT integration for high scores
- [ ] Multiplayer mode
- [ ] Tournament system

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Built with 💚 for the degen community**
