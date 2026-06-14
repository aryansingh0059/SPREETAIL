# Project Scope: Shared Expenses Application

## Core Capabilities
- **Authentication**: JWT-based email/password login.
- **Groups**: Time-aware memberships (join_date, leave_date).
- **Expense Management**: Multi-currency expenses, refunds, equal/unequal/percentage/share splits.
- **Settlements**: 1-on-1 payment tracking.
- **CSV Import Engine**: Robust, resume-able parser with step-by-step anomaly resolution.
- **Balance Calculation**: Unified base-currency balance engine.

## Anomaly Scope & Handlers
1. **Duplicate Rows**: Flag -> User Approves/Merges.
2. **Amount Comma Format**: Flag -> Propose Numerical Fix -> User Approves.
3. **Name Casing/Whitespace**: Flag -> User Maps to existing member -> Save Alias.
4. **Ambiguous Payer**: Flag -> User Maps to existing member -> Save Alias.
5. **Missing Payer**: Flag -> Require User Selection.
6. **Settlement as Expense**: Flag -> User Converts to Settlement or Provides Split Type.
7. **Percentages > 100%**: Flag -> User Adjusts to exactly 100%.
8. **Foreign Currency**: Flag -> User Provides Exchange Rate.
9. **Negative Amount**: Flag -> User Confirms as Refund or Fixes Typo.
10. **Invalid Date Format**: Flag -> User Selects Date via Picker.
11. **Missing Currency**: Flag -> User Selects Currency from Dropdown.
12. **Zero Amount**: Flag -> User Discards or Updates Amount.
13. **Inactive Member**: Flag -> User Removes from Split or Overrides.
14. **Conflicting Split**: Flag -> User Chooses to Enforce Type or Details.
15. **Contradictory Records**: Flag -> User Selects Single Source of Truth.
16. **Ambiguous Date Format**: Flag -> User Explicitly Confirms Date.
