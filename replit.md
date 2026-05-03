# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Privacy Budget (`artifacts/budget-app`)
- **Preview path**: `/`
- **Description**: Privacy-first offline budgeting app called "Vault"
- **Storage**: IndexedDB via `idb` package — all data stored locally in the browser, zero network calls
- **Stack**: React + Vite + Tailwind CSS, Recharts for charts, Wouter for routing, next-themes for dark/light mode
- **Pages**:
  - `/` — Dashboard with monthly summaries, spending charts, streak, level
  - `/add` — Add income / expense / investment transactions
  - `/history` — Full transaction history with filters, search, delete, export/import JSON
  - `/achievements` — Gamification: badges, streak, financial level, progress bars
- **Key files**:
  - `src/lib/db.ts` — IndexedDB schema and CRUD helpers
  - `src/lib/gamification.ts` — Streak, level, and achievement logic
  - `src/hooks/use-transactions.ts` — React hook wrapping all IndexedDB operations
  - `src/components/layout.tsx` — Sidebar (desktop) + bottom nav (mobile)

### API Server (`artifacts/api-server`)
- **Preview path**: `/api`
- **Description**: Shared Express API server (not used by budget app — budget app is fully local)
