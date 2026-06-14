# Project Decisions

This document tracks all engineering and architectural decisions made for the Shared Expenses Application.

## Database Schema Design

We are using PostgreSQL (via Prisma). Below is the proposed relational schema designed to handle all identified anomalies, temporal memberships, multi-currency features, and a robust, resume-able import process.

### Core Tables

1. **`users`**
   - `id` (UUID, PK)
   - `email` (String, Unique)
   - `password_hash` (String)
   - `name` (String)
   - `created_at` (DateTime)

2. **`groups`**
   - `id` (UUID, PK)
   - `name` (String)
   - `base_currency_code` (String, FK to `currencies`) - *E.g., INR. Balances are calculated in this currency.*
   - `created_at` (DateTime)

3. **`group_memberships`** (Temporal Membership)
   - `id` (UUID, PK)
   - `group_id` (UUID, FK)
   - `user_id` (UUID, FK)
   - `join_date` (Date)
   - `leave_date` (Date, Nullable) - *Handles Meera leaving, Sam joining, Dev as temporary.*
   - *Constraint:* `user_id` + `group_id` should allow multiple non-overlapping periods or just handle updates to a single row.

4. **`user_aliases`** (For Anomaly 3 & 4)
   - `id` (UUID, PK)
   - `group_id` (UUID, FK)
   - `alias_string` (String) - *E.g., "priya", "rohan ", "Priya S"*
   - `mapped_user_id` (UUID, FK)

### Expense & Settlement Tables

5. **`expenses`**
   - `id` (UUID, PK)
   - `group_id` (UUID, FK)
   - `paid_by` (UUID, FK)
   - `amount` (Decimal) - *Converted to base_currency if foreign.*
   - `original_amount` (Decimal)
   - `original_currency_code` (String, FK to `currencies`)
   - `exchange_rate_applied` (Decimal, Nullable)
   - `split_type` (Enum: EQUAL, PERCENTAGE, SHARE, UNEQUAL)
   - `date` (Date)
   - `description` (String)
   - `notes` (String, Nullable)
   - `is_refund` (Boolean) - *Handles Anomaly 9.*

6. **`expense_participants`**
   - `id` (UUID, PK)
   - `expense_id` (UUID, FK)
   - `user_id` (UUID, FK)
   - `split_value` (Decimal, Nullable) - *The raw percentage, share, or exact amount specified.*
   - `calculated_owed_amount` (Decimal) - *The mathematically computed debt in base currency.*

7. **`settlements`**
   - `id` (UUID, PK)
   - `group_id` (UUID, FK)
   - `paid_by` (UUID, FK)
   - `paid_to` (UUID, FK)
   - `amount` (Decimal)
   - `currency_code` (String, FK)
   - `date` (Date)

### Currency Tables

8. **`currencies`**
   - `code` (String, PK) - *E.g., "INR", "USD"*
   - `symbol` (String)
   - `name` (String)

9. **`exchange_rates`**
   - `id` (UUID, PK)
   - `base_currency_code` (String, FK)
   - `target_currency_code` (String, FK)
   - `rate` (Decimal)
   - `date` (Date)

### Importer Tables (Auditability & Anomaly Tracking)

10. **`import_jobs`**
    - `id` (UUID, PK)
    - `group_id` (UUID, FK)
    - `status` (Enum: PENDING, REVIEW_REQUIRED, COMPLETED, FAILED)
    - `created_by` (UUID, FK)
    - `created_at` (DateTime)

11. **`import_rows`**
    - `id` (UUID, PK)
    - `import_job_id` (UUID, FK)
    - `row_number` (Int)
    - `raw_data` (JsonB) - *The exact unchanged CSV row data.*
    - `parsed_data` (JsonB) - *The sanitized/mapped data after fixes.*
    - `status` (Enum: PENDING, ANOMALY_DETECTED, APPROVED, DISCARDED, IMPORTED)

12. **`anomalies`**
    - `id` (UUID, PK)
    - `import_row_id` (UUID, FK)
    - `anomaly_type` (String) - *E.g., "MISSING_PAYER", "DUPLICATE_ROW"*
    - `severity` (Enum: WARNING, BLOCKING)
    - `description` (String)
    - `resolution_action` (String, Nullable) - *How it was fixed.*
    - `resolved_by` (UUID, FK, Nullable)
    - `resolved_at` (DateTime, Nullable)

13. **`audit_logs`**
    - `id` (UUID, PK)
    - `user_id` (UUID, FK)
    - `action` (String)
    - `entity_type` (String)
    - `entity_id` (UUID)
    - `changes` (JsonB)
    - `created_at` (DateTime)
