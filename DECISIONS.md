# Decision Log — Spreetail Split

Each significant decision made during development, the options considered, and the rationale.

---

| # | Decision | Options Considered | Chosen & Why |
|---|---|---|---|
| D-01 | **Backend Framework** | Express, Fastify, NestJS | **Express v5** — minimal, widest ecosystem; NestJS was overkill for a single-dev REST API |
| D-02 | **ORM** | Prisma, Drizzle, Raw SQL | **Prisma** — auto-generated type-safe client + migration tooling eliminates a whole class of runtime errors |
| D-03 | **Database Hosting** | Local Postgres, Supabase, Neon | **Neon** — serverless Postgres, works via standard connection string, no vendor lock-in; Supabase auth conflicted with our custom JWT |
| D-04 | **Frontend Framework** | Vite/React, Next.js, Vanilla JS | **Vite + React** — SPA dashboard; no public pages so SSR/Next.js was unnecessary overhead |
| D-05 | **Authentication** | JWT, Server Sessions, Supabase Auth | **JWT + bcrypt** — stateless, no session store needed in production; bcrypt is industry standard for password hashing |
| D-06 | **CSV Parsing Location** | Frontend (PapaParse), Backend | **Backend (multer + csv-parser)** — persists raw rows for audit trail; frontend parsing loses the original data |
| D-07 | **Anomaly Storage** | In-memory, Persistent DB | **Persistent `Anomaly` table** — import sessions are resume-able; user can close browser and return to resolve later |
| D-08 | **Import Strategy** | Direct insert, Stage-then-commit | **Stage-then-commit** — no unreviewed data ever enters the ledger; mirrors how Xero/QuickBooks handles CSV imports |
| D-09 | **Debt Settlement Algorithm** | Simple net balances, Graph reduction | **Min-cash-flow greedy** — minimises total transaction count (same algorithm as Splitwise); N people = at most N-1 transfers |
| D-10 | **Split Types Supported** | Equal only, All 4 types | **EQUAL + PERCENTAGE + SHARE + UNEQUAL** — the CSV data itself mandated all four (rent, pizza, scooters, birthday cake) |
| D-11 | **Name Alias System** | Per-import only, Per-group persistent | **Persistent `UserAlias` table** — map `"priya"` → `Priya` once; auto-resolved on every future import for that group |
| D-12 | **Multi-Currency Handling** | Reject non-base, Auto-fetch rate, User provides rate | **Store original + user provides rate** — most accurate; avoids silent errors from mismatched public API rates |
| D-13 | **Frontend HTTP Client** | Axios, Native Fetch | **Axios** — interceptor system injects JWT on every request from a single `api.ts`; baseURL swapped via `VITE_API_URL` env var |
| D-14 | **Render Type Packages** | Custom build command, Move to `dependencies` | **Move `@types/*` to `dependencies`** — Render's default `npm install --production` skips `devDependencies`; safest fix requiring no Render config changes |
| D-15 | **Import Row State Machine** | — | **5 states**: `PENDING → ANOMALY_DETECTED → APPROVED → IMPORTED` / `DISCARDED` — COMMIT is gated until zero rows remain in PENDING or ANOMALY_DETECTED |
