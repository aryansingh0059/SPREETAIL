# Build Plan

## Phase 1: Foundation (Backend First)
**Feature 1.1**: Initialize Project
- Setup Express + TypeScript + Prisma + PostgreSQL (Neon).
- Define the Prisma Schema based on `DECISIONS.md`.
- Generate Prisma Client and run initial migrations.

**Feature 1.2**: Authentication API
- `POST /api/auth/register`
- `POST /api/auth/login` (JWT)
- Auth Middleware for protected routes.

## Phase 2: Core Domain
**Feature 2.1**: Groups & Temporal Memberships API
- `POST /api/groups`
- `POST /api/groups/:id/members` (with join/leave dates)
- `GET /api/groups/:id/members`

**Feature 2.2**: Expenses & Settlements API
- `POST /api/expenses` (Handling Equal, Unequal, Percentage, Share)
- `POST /api/settlements`

**Feature 2.3**: Balance Engine
- `GET /api/groups/:id/balances`
- Algorithm to calculate net debts using the `expense_participants` table and time-aware logic.

## Phase 3: The CSV Import Engine
**Feature 3.1**: Importer Initialization & Parsing
- `POST /api/imports/upload` (Multer, CSV parsing).
- Create `import_jobs` and `import_rows`.

**Feature 3.2**: Anomaly Detection Engine
- Implement the 16 anomaly detection rules against the parsed rows.
- Populate the `anomalies` table.

**Feature 3.3**: Resolution API
- `GET /api/imports/:id/anomalies`
- `POST /api/imports/:id/resolve-anomaly` (Apply policies 1-16).

**Feature 3.4**: Finalization
- `POST /api/imports/:id/commit` (Move approved rows to `expenses`/`settlements`).

## Phase 4: Frontend (React + Vite + Tailwind)
**Feature 4.1**: Shell & Auth UI
- Login/Register screens.
- Dashboard Layout.

**Feature 4.2**: Core UI
- Groups Dashboard & Expense List.
- Member Management.
- Balance Summary Visualization.

**Feature 4.3**: The Importer UI
- File Upload component.
- Interactive Anomaly Review Wizard (Stepping through the 16 errors).
- Data mapping and approval screens.
