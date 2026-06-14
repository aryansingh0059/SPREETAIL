# Project Scope: Spreetail Split

A production-grade shared expense management application with intelligent CSV import, anomaly detection, and automatic debt simplification.

---

## Core Capabilities

- **Authentication**: Secure JWT-based email/password login with bcrypt password hashing.
- **Groups**: Time-aware memberships with `joinDate` and `leaveDate` to handle members who join or leave mid-period.
- **Expense Management**: Multi-currency expenses, refunds (negative amounts), and all split types — Equal, Unequal, Percentage, and Share.
- **Settlements**: 1-on-1 payment tracking (e.g. "Rohan paid Aisha back ₹5000").
- **CSV Import Engine**: Resumable parser with step-by-step anomaly resolution UI.
- **Balance Calculation**: Unified base-currency balance engine using a minimum-transaction debt-simplification algorithm.
- **Alias System**: Maps CSV name variants ("priya", "Priya S", "Dev's friend Kabir") to canonical user records persistently.

---

## 🗄️ Database Schema

The PostgreSQL database (hosted on Neon) is managed via Prisma ORM.

### Entity-Relationship Overview

```
User ──< GroupMembership >── Group
User ──< Expense (paidBy)
User ──< ExpenseParticipant >── Expense
User ──< Settlement (paidBy, paidTo)
User ──< UserAlias
Group ──< ImportJob ──< ImportRow ──< Anomaly
Currency ── Expense, Settlement
```

### Table Definitions

#### `User`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier |
| `email` | String (UNIQUE) | Login email |
| `passwordHash` | String | bcrypt-hashed password |
| `name` | String | Display name |
| `createdAt` | DateTime | Account creation timestamp |

#### `Group`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier |
| `name` | String | Group name (e.g. "Apartment 4B") |
| `baseCurrencyCode` | String (FK → Currency) | Default settlement currency |
| `createdAt` | DateTime | Creation timestamp |

#### `GroupMembership`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier |
| `groupId` | UUID (FK → Group) | The group |
| `userId` | UUID (FK → User) | The member |
| `joinDate` | Date | When member joined |
| `leaveDate` | Date? | When member left (null = still active) |

#### `Currency`
| Column | Type | Description |
|---|---|---|
| `code` | String (PK) | ISO code e.g. `INR`, `USD` |
| `symbol` | String | e.g. `₹`, `$` |
| `name` | String | e.g. `Indian Rupee` |

#### `Expense`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier |
| `groupId` | UUID (FK → Group) | Which group |
| `paidById` | UUID (FK → User) | Who paid |
| `amount` | Decimal | Amount in base currency |
| `originalAmount` | Decimal | Amount in original currency |
| `originalCurrencyCode` | String (FK → Currency) | Currency the expense was in |
| `exchangeRateApplied` | Decimal? | Conversion rate applied |
| `splitType` | Enum | `EQUAL`, `PERCENTAGE`, `SHARE`, `UNEQUAL` |
| `date` | Date | Expense date |
| `description` | String | What it was for |
| `notes` | String? | Free-text notes |
| `isRefund` | Boolean | True if amount was negative |
| `createdAt` | DateTime | Record creation timestamp |

#### `ExpenseParticipant`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier |
| `expenseId` | UUID (FK → Expense) | The parent expense |
| `userId` | UUID (FK → User) | The participant |
| `splitValue` | Decimal? | Input value (%, share count, or exact amount) |
| `calculatedOwedAmount` | Decimal | Final computed amount this person owes |

#### `Settlement`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier |
| `groupId` | UUID (FK → Group) | Which group |
| `paidById` | UUID (FK → User) | Who paid |
| `paidToId` | UUID (FK → User) | Who received |
| `amount` | Decimal | Amount settled |
| `currencyCode` | String (FK → Currency) | Currency of settlement |
| `date` | Date | Settlement date |
| `createdAt` | DateTime | Record creation timestamp |

#### `UserAlias`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier |
| `groupId` | UUID (FK → Group) | Alias is scoped to this group |
| `aliasString` | String | The raw name found in CSV (e.g. `"priya"`, `"Priya S"`) |
| `mappedUserId` | UUID (FK → User) | The canonical user this alias maps to |

#### `ImportJob`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier |
| `groupId` | UUID (FK → Group) | Target group |
| `status` | Enum | `PENDING`, `REVIEW_REQUIRED`, `COMPLETED`, `FAILED` |
| `createdBy` | UUID? | User who uploaded the file |
| `createdAt` | DateTime | Upload timestamp |

#### `ImportRow`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier |
| `importJobId` | UUID (FK → ImportJob) | Parent import session |
| `rowNumber` | Int | Row number in the original CSV |
| `rawData` | JSON | Exact original parsed CSV row |
| `parsedData` | JSON? | Corrected version after user resolves anomalies |
| `status` | Enum | `PENDING`, `ANOMALY_DETECTED`, `APPROVED`, `DISCARDED`, `IMPORTED` |

#### `Anomaly`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier |
| `importRowId` | UUID (FK → ImportRow) | The affected row |
| `anomalyType` | String | Machine-readable type code (see log below) |
| `severity` | Enum | `WARNING` (non-blocking) or `BLOCKING` |
| `description` | String | Human-readable description |
| `resolutionAction` | String? | What the user chose to do |
| `resolvedById` | UUID? | The user who resolved it |
| `resolvedAt` | DateTime? | Timestamp of resolution |

#### `AuditLog`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Unique identifier |
| `userId` | UUID (FK → User) | Who performed the action |
| `action` | String | Action type (e.g. `IMPORT_COMMITTED`) |
| `entityType` | String | What was affected (e.g. `Expense`) |
| `entityId` | String | ID of the affected record |
| `changes` | JSON | Before/after snapshot |
| `createdAt` | DateTime | When it happened |

---

## 🔍 Anomaly Log — CSV Data Problems Found & How They Were Handled

The file `expenses_export.csv` was used as the primary test dataset. Below is a complete log of every data problem found and how the system handles it.

### Row-by-Row Anomaly Analysis

| Row | Description (CSV) | Anomaly Detected | Severity | How Handled |
|-----|---|---|---|---|
| 5 | `Dinner at Marina Bites` | — (Dev is a valid guest) | — | Imported cleanly |
| **6** | `dinner - marina bites` by Dev, same date & amount as Row 5 | **DUPLICATE_OR_CONTRADICTORY** | ⚠️ WARNING | Both rows flagged. User chooses which to keep or merge. |
| **7** | `Electricity Feb`, amount `"1,200"` | **AMOUNT_COMMA_FORMAT** | 🚫 BLOCKING | Engine strips comma and proposes `1200`. User approves fix. |
| **9** | `Movie night snacks`, paid by `priya` (lowercase) | **UNKNOWN_PARTICIPANT** | 🚫 BLOCKING | Name does not match group roster. User maps `"priya"` → `Priya` and saves alias permanently. |
| **11** | `Groceries DMart`, paid by `Priya S` | **UNKNOWN_PARTICIPANT** | 🚫 BLOCKING | `"Priya S"` is not a registered member. User maps to `Priya`. Alias saved for future imports. |
| **13** | `House cleaning supplies`, `paid_by` is empty | **MISSING_PAYER** | 🚫 BLOCKING | Row is blocked until user selects who paid from member dropdown. |
| **14** | `Rohan paid Aisha back`, no `split_type`, only one person in `split_with` | **POTENTIAL_SETTLEMENT** | ⚠️ WARNING | Detected as a likely settlement. User confirms and row is committed to the `Settlement` table, not `Expense`. |
| **15** | `Pizza Friday`, percentages: `30+30+30+20 = 110%` | **INVALID_PERCENTAGE** | 🚫 BLOCKING | Engine detects sum ≠ 100%. User corrects one value (e.g. Meera → 10%) until total = 100%. |
| **20** | `Goa villa booking`, currency `USD` (group base is INR) | **FOREIGN_CURRENCY** | 🚫 BLOCKING | Engine flags foreign currency. User provides exchange rate (e.g. 1 USD = 84 INR). Amount converted and stored in both `originalAmount` and `amount`. |
| **21** | `Beach shack lunch`, currency `USD` | **FOREIGN_CURRENCY** | 🚫 BLOCKING | Same as above. Exchange rate applied. |
| **23** | `Parasailing`, split includes `Dev's friend Kabir` — unknown name | **UNKNOWN_PARTICIPANT** | 🚫 BLOCKING | `Kabir` is not a member. User maps to existing user or creates new member account. |
| **25** | `Thalassa dinner`, same date + ~same amount as Row 24 (`Dinner at Thalassa`) | **DUPLICATE_OR_CONTRADICTORY** | ⚠️ WARNING | Both rows flagged. Note in CSV says "Aisha also logged this". User discards one as a duplicate. |
| **26** | `Parasailing refund`, amount `-30` USD | **NEGATIVE_AMOUNT** + **FOREIGN_CURRENCY** | 🚫 BLOCKING | Engine detects negative amount and asks user to confirm as refund. Also flags USD currency. User confirms refund; `isRefund = true` set on commit. |
| **27** | `Airport cab`, date `Mar-14` (not `DD-MM-YYYY`), paid by `rohan ` (trailing space) | **INVALID_DATE** + **UNKNOWN_PARTICIPANT** | 🚫 BLOCKING | Date format is unrecognisable. User picks date via calendar picker. `"rohan "` doesn't match `"Rohan"`; mapped via alias. |
| **28** | `Groceries DMart`, `currency` column empty | **MISSING_CURRENCY** | 🚫 BLOCKING | Engine flags blank currency. User selects from dropdown (defaults to group base currency). |
| **31** | `Dinner order Swiggy`, amount `0` | **ZERO_AMOUNT** | ⚠️ WARNING | Likely a placeholder or mistake. User is warned and can discard the row or correct the amount. |
| **34** | `Deep cleaning service`, date `04-05-2026` — both parts ≤ 12 (could be Apr 5 or May 4) | **AMBIGUOUS_DATE** | ⚠️ WARNING | CSV note says "is this April 5 or May 4?". Engine flags it. User explicitly confirms the correct date via date picker. |
| **36** | `Groceries BigBasket`, `split_with` includes `Meera` who had already left the group | **UNKNOWN_PARTICIPANT** (or inactive member) | 🚫 BLOCKING | CSV note says "oops Meera still in the group list". Engine flags `Meera` as unknown/inactive. User removes her from the split. |
| **42** | `Furniture for common room`, `split_type = equal` but `split_details` also provided (`Aisha 1; Rohan 1; Priya 1; Sam 1`) | **CONFLICTING_SPLIT** | 🚫 BLOCKING | Split type says EQUAL but row has detail values. Engine flags contradiction. User chooses: enforce EQUAL (ignore details) or switch to SHARE type. |

---

## Anomaly Type Reference

| Code | Severity | Description |
|---|---|---|
| `DUPLICATE_OR_CONTRADICTORY` | ⚠️ WARNING | Same date + amount + payer found on multiple rows |
| `AMOUNT_COMMA_FORMAT` | 🚫 BLOCKING | Amount contains commas (e.g. `"1,200"`) instead of numeric format |
| `UNKNOWN_PARTICIPANT` | 🚫 BLOCKING | Name in `paid_by` or `split_with` does not match any group member |
| `AMBIGUOUS_PAYER` | 🚫 BLOCKING | Payer name is ambiguous between multiple members |
| `MISSING_PAYER` | 🚫 BLOCKING | `paid_by` column is empty |
| `POTENTIAL_SETTLEMENT` | ⚠️ WARNING | No `split_type` and only one `split_with` — likely a direct payment |
| `INVALID_PERCENTAGE` | 🚫 BLOCKING | Percentage splits do not sum to exactly 100% |
| `FOREIGN_CURRENCY` | 🚫 BLOCKING | Expense currency differs from group's base currency |
| `NEGATIVE_AMOUNT` | 🚫 BLOCKING | Amount is negative — may be a refund |
| `INVALID_DATE` | 🚫 BLOCKING | Date is in an unrecognisable format |
| `MISSING_CURRENCY` | 🚫 BLOCKING | `currency` column is empty |
| `ZERO_AMOUNT` | ⚠️ WARNING | Amount is exactly 0 |
| `AMBIGUOUS_DATE` | ⚠️ WARNING | Both date parts ≤ 12, making DD-MM vs MM-DD ambiguous |
| `CONFLICTING_SPLIT` | 🚫 BLOCKING | `split_type` contradicts the content of `split_details` |

---

## Resolution Workflow

```
CSV Upload
    │
    ▼
Parse Rows → Store as ImportRow (rawData)
    │
    ▼
Run Anomaly Engine → Create Anomaly records
    │
    ├── No Anomalies → Row status = APPROVED (auto)
    │
    └── Anomalies Found → Row status = ANOMALY_DETECTED
              │
              ▼
         User reviews in Import UI
              │
              ├── Resolves each anomaly (fix, map, discard)
              │      → parsedData updated
              │      → Anomaly marked resolvedAt
              │
              └── All anomalies resolved → Row status = APPROVED
                        │
                        ▼
                 User clicks COMMIT
                        │
                        ├── APPROVED rows → committed to Expense / Settlement tables
                        └── ImportJob status → COMPLETED
```
