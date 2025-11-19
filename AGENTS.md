# Amp Agents Documentation

## Commands

### Frontend (`flappy-bird/`)
- **Dev**: `cd flappy-bird && npm run dev`
- **Build**: `cd flappy-bird && npm run build`
- **Lint**: `cd flappy-bird && npm run lint`

### Backend (`backend/`)
- **Start**: `cd backend && npx ts-node src/server.ts`
- **No tests configured** in `package.json` yet.

## Architecture & Structure

- **Monorepo-style**:
  - `backend/`: Express API (Port 3001), Postgres, Redis, BullMQ. Handles game state, scores, payouts, and Solana fee watching.
  - `flappy-bird/`: Next.js 16 frontend with Tailwind CSS 4.
- **Backend Key Components**:
  - `src/services`: `FeeWatcher` (Solana), `ScoreService`, `PayoutService` (BullMQ worker).
  - `src/db`: Postgres connection and schema.
- **Database**: Postgres (primary), Redis (queues).

## Code Style & Conventions

- **TypeScript**: Strict mode enabled in both projects.
- **Backend**:
  - Use `import` syntax (ESM style) in `server.ts`.
  - Services pattern for business logic.
  - `dotenv` for configuration.
- **Frontend**:
  - Functional Components with Hooks.
  - `use client` directive for client-side components.
  - Tailwind CSS for styling.
