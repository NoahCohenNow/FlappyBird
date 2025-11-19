# Amp Agents Documentation

## Commands
- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Start**: `npm run start`
- *Note: No test scripts are currently configured in package.json.*

## Architecture & Structure
- **Framework**: Next.js 16 (App Router) with React 19.
- **Styling**: Tailwind CSS 4.
- **Main Directories**:
  - `src/app`: App Router pages and layouts.
  - `src/components`: Reusable React components (e.g., `Game.tsx`).
- **Path Aliases**: `@/*` resolves to `./src/*`.

## Code Style & Conventions
- **Language**: TypeScript (Strict mode enabled).
- **Components**: Use Functional Components.
- **Client/Server**: Explicitly mark client components with `'use client'`.
- **Imports**: Use `@/` alias for internal imports.
- **Linting**: Follow rules defined in `eslint.config.mjs`.
