# Decision Log — Spreetail Split

Each significant engineering and product decision made during development, with options considered and rationale.

---

## D-01: Backend Framework
**Options:** Express, Fastify, NestJS
**Chosen: Express v5**
Express was chosen for its simplicity and the largest ecosystem. NestJS was overkill for a single-developer REST API — too much boilerplate with decorators and modules. Fastify is faster but has a smaller community. Express v5 was specifically used because it includes built-in async error propagation without needing wrapper middleware.

## D-02: ORM
**Options:** Prisma, Drizzle, Raw SQL (`pg`)
**Chosen: Prisma**
Prisma's `schema.prisma` file acts as a single source of truth. Its auto-generated TypeScript client eliminates runtime type errors entirely. The `prisma migrate` workflow made schema evolution (adding `UserAlias`, `AuditLog`, `ImportRow`) iterative and safe. Drizzle was considered but has a smaller ecosystem; raw SQL was ruled out for lack of type safety.

## D-03: Database Hosting
**Options:** Local Postgres, Supabase, Neon
**Chosen: Neon (Serverless PostgreSQL)**
Neon provides a standard PostgreSQL connection string that works with any Prisma/pg setup — no vendor-specific API. Supabase was ruled out because its built-in auth system would conflict with our custom JWT authentication. Neon's free tier is sufficient for the project scope.

## D-04: Frontend Framework
**Options:** Vite + React, Next.js, Vanilla JS
**Chosen: Vite + React (TypeScript)**
The app is a client-side dashboard for authenticated users — no public pages requiring SSR or SEO. Next.js would add deployment complexity with no benefit. React's component model is ideal for the modal-heavy, stateful UI. Vite provides the fastest hot-module-replacement in development.

## D-05: Authentication
**Options:** JWT, Server-side Sessions, Supabase Auth
**Chosen: JWT + bcrypt**
JWT is stateless — no session store (Redis, DB) required in production. The backend signs tokens with `JWT_SECRET` and the frontend stores them in `localStorage`. bcrypt is the industry standard for password hashing with a configurable work factor for brute-force resistance. Supabase Auth was ruled out due to vendor coupling.

## D-06: CSV Parsing Location
**Options:** Frontend (PapaParse), Backend (multer + csv-parser)
**Chosen: Backend**
Parsing on the backend allows storing the exact, unmodified CSV row as `rawData` in the `ImportRow` table. This audit trail is critical — you can always compare the original file data against what was committed to the ledger after anomaly resolution. Frontend parsing would lose this auditability entirely.

## D-07: Anomaly Storage
**Options:** In-memory / session only, Persistent database records
**Chosen: Persistent `Anomaly` table**
Storing anomalies as database rows means import sessions are resume-able. A user can upload a file, resolve 5 anomalies, close their browser, return the next day, and pick up where they left off. In-memory storage loses all progress on page refresh, which is unacceptable for large imports.

## D-08: Import Strategy
**Options:** Direct insert on upload, Stage-then-commit (two-phase)
**Chosen: Stage-then-commit**
Inserting unreviewed CSV data directly into the `Expense` table would corrupt balance calculations the moment a bad row lands. The two-phase approach (`ImportRow` staging → anomaly resolution → explicit COMMIT) ensures only clean, user-approved data enters the live ledger. This mirrors how Xero and QuickBooks handle CSV imports.

## D-09: Debt Settlement Algorithm
**Options:** Simple net balances, Min-cash-flow greedy graph reduction
**Chosen: Min-cash-flow greedy**
The greedy algorithm repeatedly pairs the largest creditor with the largest debtor, creating one transfer each time. For N people it produces at most N-1 transfers regardless of how many expenses exist. This is the same algorithm used by Splitwise. Simple net balances can produce more transfers in certain group configurations.

## D-10: Split Types Supported
**Options:** EQUAL only, All four types (EQUAL, PERCENTAGE, SHARE, UNEQUAL)
**Chosen: All four**
The CSV data mandated this decision. The dataset contains equal splits (rent), percentage splits (pizza where one person pays less), share-weighted splits (scooter rentals where Rohan and Dev took bigger bikes), and unequal exact-amount splits (birthday cake where Aisha was not charged). One split type could not represent all of these accurately.

## D-11: Name Alias System
**Options:** Per-import mapping (not saved), Per-group persistent `UserAlias`
**Chosen: Persistent aliases per group**
When a user resolves `"priya"` → `Priya` or `"Priya S"` → `Priya`, that mapping is saved to the `UserAlias` table scoped to the group. Every subsequent CSV import for that group automatically resolves these names without user intervention. Per-import-only mapping would force users to repeat the same resolutions every time.

## D-12: Multi-Currency Handling
**Options:** Reject non-base-currency rows, Auto-fetch rate from API, User provides rate
**Chosen: Store original + user provides rate**
Storing both `originalAmount` (e.g. 540 USD) and `amount` (e.g. 45,630 INR) preserves the full audit trail. Requiring the user to provide the exchange rate ensures accuracy — the actual rate on their credit card may differ from any public API rate. Auto-fetching rates was ruled out to avoid silent inaccuracies.

## D-13: Frontend HTTP Client
**Options:** Axios, Native Fetch API
**Chosen: Axios**
Axios's interceptor system allowed a single `api.ts` file to automatically attach the JWT `Authorization` header to every outbound request. Without interceptors, every API call across the codebase would need to manually pass the header. The centralised `baseURL` also made switching from `localhost:4000` to the Render production URL a one-line environment variable change.

## D-14: Type Packages on Render
**Options:** Change Render build command to `--include=dev`, Move `@types/*` to `dependencies`
**Chosen: Move to `dependencies`**
Render runs `npm install --production` by default, skipping `devDependencies`. This caused every TypeScript type package (`@types/node`, `@types/express`, etc.) to be missing at build time. Moving them to `dependencies` ensures they are always installed without requiring custom Render configuration that could be accidentally deleted.

## D-15: Import Row State Machine
**States:** `PENDING → ANOMALY_DETECTED → APPROVED → IMPORTED` / `DISCARDED`
The five-state machine makes the import UI deterministic. The COMMIT button is only enabled when zero rows remain in `PENDING` or `ANOMALY_DETECTED` states. `DISCARDED` is a terminal state for rows the user explicitly rejects (e.g. duplicates). `IMPORTED` is the terminal success state after the commit transaction writes the row to the live ledger.
