# Swasthya

Hybrid behavioral distress intelligence and emotional wellbeing ecosystem.

## Monorepo Structure

This project uses a `pnpm` monorepo structure.

- `/apps/mobile`: React Native Expo application (Frontend)
- `/apps/backend`: Node.js Express server (Backend)
- `/packages/shared-types`: Shared TypeScript interfaces

## Quick Start

### 1. Install dependencies

Run from the root of the workspace:

```bash
pnpm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` in the `/apps/backend` directory and fill in the required Azure/Firebase keys.

### 3. Start development servers

**Backend:**
```bash
pnpm dev:backend
```

**Mobile:**
```bash
pnpm dev:mobile
```

**Shared Types:**
If you make changes to `/packages/shared-types`, rebuild them:
```bash
pnpm build:types
```

## Architecture Notes
- Prioritize low-friction behavioral intelligence.
- Do NOT overengineer abstractions.
- Ensure the app feels calming and supportive, not like a productivity platform.
