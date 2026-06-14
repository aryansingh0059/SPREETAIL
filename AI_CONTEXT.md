# AI Context - Shared Expenses Application

## Project State
- **Phase**: Execution (Building Feature 4.3)
- **Next Step**: Initialize Backend Project (Express + Prisma).

## Decisions Made
- **Database Schema**: Approved. Documented in DECISIONS.md.
- **Build Plan**: Approved. Documented in BUILD_PLAN.md.
- **Tech Stack**: React, Vite, Tailwind, Node.js, Express, PostgreSQL, Prisma, JWT, Vercel, Render, Neon.
- **Anomaly 1 (Duplicate Rows)**: Flag during import based on matching date, paid_by, amount, and normalized description. Require user approval to either merge (keeping the one with most metadata) or keep both.
- **Anomaly 2 (Comma in Amount)**: Flag during import. Present proposed numerical fix to user. Require user approval to proceed (no silent fixes).
- **Anomaly 3 (Name casing/whitespace)**: Flag as Unknown Participant. Require user to map to existing member manually. Save as alias for future auto-resolution.
- **Anomaly 4 (Ambiguous payer)**: Treated same as Anomaly 3 via the Alias resolution flow (User maps "Priya S" to "Priya").
- **Anomaly 5 (Missing paid_by)**: Flag during import. Require user to manually select a payer from a dropdown of active members before proceeding.
- **Anomaly 6 (Settlement as expense)**: Flag missing split_type & 1-on-1 logic. Require user to explicitly convert it to a Settlement record or provide a split_type to keep as an Expense.
- **Anomaly 7 (Percentages sum > 100)**: Flag during import. Require user to manually adjust percentages in the UI to exactly 100% before allowing import.
- **Anomaly 8 (Foreign currency)**: Flag during import. Require user to provide an exchange rate. Store original currency/amount for auditability, but calculate balances in the base currency (INR).
- **Anomaly 9 (Negative amount)**: Flag during import. Require user to confirm if it should be treated as a Refund (inverting balances) or corrected to a positive expense (if it was a typo).
- **Anomaly 10 (Invalid date format)**: Flag during import. Pause and require user to manually select the correct date via a date picker before proceeding.
- **Anomaly 11 (Missing currency)**: Flag during import. Require user to explicitly select the currency from a dropdown (no silent fallback).
- **Anomaly 12 (Zero amount expense)**: Flag during import. Require user to either discard the row entirely or update the amount to a valid positive value.
- **Anomaly 13 (Inactive member)**: Flag when a split participant is outside their active membership dates. Require user to remove them from the split or explicitly override to keep them.
- **Anomaly 14 (Conflicting split type/details)**: Flag during import. Require user to choose which parameter to enforce (e.g., clear details to enforce 'equal', or update type to 'share' to enforce details).
- **Anomaly 15 (Contradictory records)**: Flag via fuzzy matching (same date/amount/participants/description). Require user to select a single source of truth or explicitly confirm both.
- **Anomaly 16 (Ambiguous date format)**: Flag dates like 04-05-2026. Require user to explicitly confirm the date (e.g., April 5 vs May 4) via a UI prompt.

## Open Questions
*(None yet)*
