# Decision Log — Spreetail Split

This document tracks every significant engineering, architectural, and product decision made during the development of this application. For each decision, we document the options considered and why the chosen approach was selected.

---

## D-01: Backend Framework — Express vs Fastify vs NestJS

**Context:** Needed a Node.js web framework to build the API.

| Option | Pros | Cons |
|---|---|---|
| **Express** | Minimal, most widely used, huge ecosystem, easy to reason about | Less opinionated, requires manual setup for everything |
| Fastify | Faster throughput, schema-based validation built-in | Smaller ecosystem, less tutorial coverage |
| NestJS | Highly structured, decorator-based, great for large teams | Heavy boilerplate, over-engineered for a single-developer project |

**Decision: Express (v5)**
Express was chosen for its simplicity and familiarity. Since the backend is a focused REST API without complex service boundaries, NestJS's overhead was unnecessary. Express v5 was used specifically because it includes built-in async error propagation.

---

## D-02: ORM — Prisma vs Drizzle vs Raw SQL

**Context:** Needed a database access layer for PostgreSQL.

| Option | Pros | Cons |
|---|---|---|
| **Prisma** | Auto-generated type-safe client, excellent migration tooling, readable schema file | Slightly heavier runtime, generated types need regenerating after schema changes |
| Drizzle | Lightweight, SQL-first, very fast | Requires more manual type wiring, smaller ecosystem |
| Raw SQL (pg) | Maximum control, zero overhead | No type safety, error-prone, verbose |

**Decision: Prisma**
Prisma's schema file acts as a single source of truth for the entire database, and its generated TypeScript client eliminates an entire class of runtime errors. The `prisma migrate` workflow made it easy to evolve the schema iteratively as new requirements (like `UserAlias`, `AuditLog`) were added. The tradeoff of running `npx prisma generate` after every schema change was considered acceptable.

---

## D-03: Database Hosting — Local Postgres vs Supabase vs Neon

**Context:** Needed a cloud-hosted PostgreSQL database for production deployment.

| Option | Pros | Cons |
|---|---|---|
| Local Postgres | Free, fast locally | Cannot be reached by Render/Vercel in production |
| Supabase | Free tier, includes auth and realtime | Opinionated stack, auth system conflicts with our custom JWT auth |
| **Neon** | Serverless Postgres, generous free tier, works via connection string | Cold-start latency on free tier |

**Decision: Neon (Serverless PostgreSQL)**
Neon was chosen because it provides a standard PostgreSQL connection string that works seamlessly with Prisma and the `@prisma/adapter-pg` driver. It has no vendor-specific API to learn, and the free tier is adequate for the project scope. Supabase was ruled out because its built-in auth system would conflict with our custom JWT implementation.

---

## D-04: Frontend Framework — Vite/React vs Next.js vs Vanilla JS

**Context:** Needed a frontend framework for the UI.

| Option | Pros | Cons |
|---|---|---|
| **Vite + React** | Fast HMR, minimal config, SPA is appropriate for this app | No SSR (not needed here) |
| Next.js | SSR, file-based routing | Overkill for a dashboard SPA, adds deployment complexity |
| Vanilla JS | Zero dependencies | Would require reinventing routing, state management from scratch |

**Decision: Vite + React (TypeScript)**
The app is a client-side dashboard where users are authenticated. There are no public-facing pages that require SEO or SSR. React's component model is ideal for the modal-heavy, stateful UI. Vite provides the fastest development experience.

---

## D-05: Authentication Strategy — JWT vs Sessions vs Supabase Auth

**Context:** Users need to log in securely. The backend must validate their identity on every request.

| Option | Pros | Cons |
|---|---|---|
| **JWT (jsonwebtoken + bcrypt)** | Stateless, no session store required, works well with REST APIs | Cannot revoke tokens until they expire (acceptable for this scope) |
| Server-side sessions (express-session) | Easy to revoke, simple to implement | Requires a Redis/DB session store in production |
| Supabase Auth | Pre-built, handles refresh tokens | Tightly coupled to Supabase, conflicts with custom backend |

**Decision: JWT with bcrypt**
JWT was chosen because the app is a REST API consumed by a SPA. Stateless tokens mean no session store is needed, simplifying deployment. Tokens are signed with a secret (`JWT_SECRET`) and expire after a defined period. bcrypt is used for password hashing as it is the industry standard with a built-in work factor for brute-force resistance.

---

## D-06: CSV Parsing Strategy — Frontend Parse vs Backend Parse

**Context:** The app needs to ingest CSV files of expense data.

| Option | Pros | Cons |
|---|---|---|
| **Backend parsing (multer + csv-parser)** | Centralised logic, persistent storage of raw rows, can be audited | Requires file upload endpoint |
| Frontend parsing (PapaParse) | Faster preview, no network round-trip | Business logic in the browser, harder to audit, no persistence |

**Decision: Backend parsing with `multer` + `csv-parser`**
Parsing on the backend was chosen because it allows us to store the raw, unmodified CSV data as `rawData` in the `ImportRow` table. This is critical for auditability — we can always compare what was in the original file vs. what was committed to the ledger. Frontend parsing would mean losing this audit trail.

---

## D-07: Anomaly Storage — In-Memory vs Persistent Database Records

**Context:** Once anomalies are detected, should they be stored or just returned to the frontend?

| Option | Pros | Cons |
|---|---|---|
| **Persistent DB records (Anomaly table)** | Resume-able, auditable, survives page refresh | More complex schema, requires resolution workflow |
| In-memory / session-based | Simpler | Lost if browser refreshes; cannot be resumed; no audit trail |

**Decision: Persistent Anomaly records**
Storing anomalies as database rows means a user can upload a CSV, close the browser, return the next day, and continue resolving anomalies from where they left off. This is the correct approach for real-world data imports where anomaly resolution may take significant time. Each `Anomaly` row tracks `resolvedById` and `resolvedAt` for complete accountability.

---

## D-08: Two-Phase Import — Direct Insert vs Stage-then-Commit

**Context:** Should CSV rows be written directly to the `Expense` table, or staged first?

| Option | Pros | Cons |
|---|---|---|
| **Stage in `ImportRow`, then commit** | Allows review, correction, and discard before affecting ledger | More complex, two-step UX |
| Direct insert on upload | Simpler, faster | No ability to review; bad data enters the ledger immediately |

**Decision: Stage-then-commit (two-phase import)**
Directly inserting unreviewed data into the ledger would corrupt the group's balance calculations. The two-phase approach (`ImportRow` staging → anomaly resolution → `COMMIT` endpoint) ensures only clean, user-approved data enters the `Expense` and `Settlement` tables. This mirrors how real accounting software (QuickBooks, Xero) handles CSV imports.

---

## D-09: Debt Simplification Algorithm — Simple Net vs Graph Reduction

**Context:** After calculating who owes whom, how do we minimise the number of transactions needed to settle?

| Option | Pros | Cons |
|---|---|---|
| Simple net balances (who is +ve and who is -ve) | Easy to understand | Produces too many transactions (N parties = N-1 transfers minimum, often more) |
| **Min-cash-flow / greedy graph reduction** | Minimises total number of transactions | Slightly more complex to implement |

**Decision: Min-cash-flow greedy algorithm**
The greedy approach repeatedly matches the person with the highest positive balance (biggest creditor) against the person with the most negative balance (biggest debtor), creating one transfer each time. This always minimises the transaction count. For a group of N people, it produces at most N-1 transfers regardless of the number of expenses. This is the same algorithm used by Splitwise.

---

## D-10: Split Types Supported — Equal Only vs All Types

**Context:** The CSV contained multiple split types. How many should we support?

| Option | Pros | Cons |
|---|---|---|
| EQUAL only | Simple | Cannot handle the Goa trip scooter rentals, birthday cake, or percentage pizza |
| **EQUAL + PERCENTAGE + SHARE + UNEQUAL** | Handles all real-world cases in the CSV | More complex split calculator |

**Decision: All four split types**
The CSV data itself mandated this decision. The data contained equal splits (rent), percentage splits (pizza with specific allocations), share-weighted splits (scooter rentals where Rohan and Dev took bigger bikes), and unequal splits (birthday cake where Aisha was not charged). Supporting all four types was required to correctly model the actual data.

---

## D-11: Alias System — Per-Import vs Per-Group Persistence

**Context:** When a user resolves an `UNKNOWN_PARTICIPANT` anomaly by mapping `"priya"` → `Priya`, should that mapping be remembered?

| Option | Pros | Cons |
|---|---|---|
| Per-import only (not saved) | Simpler | User must re-map the same alias every time they upload a new CSV |
| **Per-group persistent alias (UserAlias table)** | Maps are saved once and automatically applied on future imports | Requires alias table and lookup logic |

**Decision: Persistent UserAlias per group**
Saving aliases to the database means a user only needs to resolve `"priya"` → `Priya` once. Every subsequent CSV upload for the same group will automatically recognise `"priya"` without intervention. This dramatically reduces the manual review burden for recurring imports.

---

## D-12: Multi-Currency Handling — Single Currency vs Conversion at Import

**Context:** The CSV included USD expenses within an INR-base group.

| Option | Pros | Cons |
|---|---|---|
| Reject non-base-currency rows | Simple | Loses real data; real groups do spend in foreign currencies |
| **Store original + converted, user provides rate** | Preserves original data, auditable, accurate | Requires user input for exchange rate |
| Auto-fetch exchange rate from API | No user input needed | Rate may differ from what was actually paid; adds external dependency |

**Decision: Store both `originalAmount` + `amount`, user provides the rate**
Storing both values preserves the audit trail (you can always see the original USD amount). Requiring the user to provide the exchange rate ensures accuracy — the rate they actually got on their card may differ from any public API rate. This was considered more honest than silently applying a potentially wrong auto-fetched rate.

---

## D-13: Frontend API Client — Axios vs Fetch

**Context:** The frontend needed an HTTP client to talk to the backend.

| Option | Pros | Cons |
|---|---|---|
| **Axios** | Request/response interceptors, automatic JSON parsing, easy error handling | External dependency |
| Native Fetch | Zero dependencies, built into browser | No interceptors, verbose error handling, no automatic JSON parsing |

**Decision: Axios**
Axios was chosen specifically because its interceptor system allowed us to build a single `api.ts` file that automatically attaches the JWT token to every request. This eliminates the need to manually pass headers in every API call across the codebase. The centralised `baseURL` also made switching from `localhost:4000` to the Render production URL a one-line config change via `VITE_API_URL`.

---

## D-14: Render Build — devDependencies vs dependencies for TypeScript types

**Context:** Render's default `npm install` uses `--production`, which skips `devDependencies`. All `@types/*` packages were originally in `devDependencies`, causing build failures.

| Option | Pros | Cons |
|---|---|---|
| Change Render build command to `npm install --include=dev` | Keeps package.json structure clean | Requires custom build command in Render settings (easy to forget) |
| **Move `@types/*` to `dependencies`** | Build works with Render's default `npm install` | `@types` packages in `dependencies` is unconventional |

**Decision: Move `@types/*` packages to `dependencies`**
Since Render's `npm install` runs in production mode by default, the safest fix that requires no special Render configuration is to promote the type packages to `dependencies`. This guarantees the build always succeeds regardless of the hosting provider's npm install flags.

---

## D-15: Import Row Status Machine

**Context:** An `ImportRow` passes through multiple states during the import lifecycle.

**Decision: 5-state status machine**

```
PENDING ──→ ANOMALY_DETECTED ──→ APPROVED ──→ IMPORTED
    │                                │
    └──────────→ APPROVED ───────────┘
                     │
                     └──→ DISCARDED
```

| State | Meaning |
|---|---|
| `PENDING` | Row has been ingested but not yet reviewed |
| `ANOMALY_DETECTED` | Engine flagged one or more anomalies |
| `APPROVED` | All anomalies resolved; row is ready to commit |
| `DISCARDED` | User explicitly rejected this row (e.g. duplicate) |
| `IMPORTED` | Row has been committed to the live `Expense`/`Settlement` table |

This state machine was chosen to make the UI deterministic — the COMMIT button can only be enabled when zero rows are in `PENDING` or `ANOMALY_DETECTED` states.
