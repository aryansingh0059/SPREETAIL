# AI Usage Log — Spreetail Split

This document records the AI tools used throughout the development of this project, the key prompts that drove implementation, and an honest account of cases where AI-generated output was incorrect, how it was caught, and what was changed to fix it.

---

## Tools Used

| Tool | Provider | Role in this Project |
|---|---|---|
| **Antigravity** | Google DeepMind | Primary agentic coding assistant. Used for end-to-end implementation — creating files, editing code, running shell commands, fixing build errors, and managing Git. Responsible for the majority of TypeScript source code. |
| **ChatGPT** (GPT-4o) | OpenAI | Used in the planning phase for architecture discussions, schema design brainstorming, and explaining Prisma concepts. Also used for generating initial anomaly detection logic pseudocode. |
| **Claude** (Claude 3.5 Sonnet) | Anthropic | Used for code review passes, refactoring suggestions on the balance engine and split calculator, and reviewing the anomaly resolution workflow logic. |

---

## Key Prompts Used

The following prompts were the most impactful in driving the implementation.

### Architecture & Planning

> *"I need to build a shared expense splitting app. Users can be in groups, expenses have different split types (equal, percentage, share, unequal), and I need to import expenses from a CSV. The CSV has data quality issues — missing payers, foreign currencies, duplicate rows, ambiguous dates. Design a PostgreSQL schema that handles all of this cleanly, including a two-phase import pipeline with an anomaly review step."*

This prompt (given to ChatGPT) produced the foundational schema that eventually became `schema.prisma`, including the `ImportJob → ImportRow → Anomaly` staging pipeline.

---

> *"Build the backend Express server in TypeScript with Prisma. Include routes for: auth (register/login), groups (CRUD + members), expenses, settlements, balances, and a CSV import pipeline with anomaly detection and a commit step."*

This prompt (given to Antigravity) produced the full backend scaffold across 6+ route files, the middleware, and the utility functions.

---

> *"The anomaly engine needs to run immediately on upload. It should detect: duplicate rows (by signature), amounts with commas, unknown participant names, missing payer, potential settlements, invalid percentages, foreign currency, negative amounts, zero amounts, missing currency, invalid date formats, ambiguous dates (both parts ≤ 12), and conflicting split type vs details."*

This prompt produced `anomalyDetector.ts` with the complete detection logic across all 16 anomaly categories.

---

> *"Redesign the frontend UI to use a clean orange and white theme. The dashboard should have a 2-column layout — expense history on the left, balances and members on the right. The import page should be a split-screen with the upload area on the left and the anomaly report table on the right."*

This prompt (given to Antigravity) drove the complete UI overhaul, including the modals, the balance ledger display, and the import report table.

---

> *"My Render deployment is failing. `@types/node` is in devDependencies but Render runs `npm install --production`. Also `seed_demo.ts` and `test_db.ts` are not under rootDir `./src`. Fix all three TypeScript build errors and show me the corrected `tsconfig.json`."*

This prompt drove the tsconfig fix session that resolved the three Render build failures simultaneously.

---

## ❌ Cases Where AI Was Wrong

The following are three concrete cases where the AI-generated output was incorrect, how it was caught, and exactly what was changed.

---

### Error #1: `exactOptionalPropertyTypes` Conflict with `strict: false`

**What the AI did:**
When initially setting up `backend/tsconfig.json`, the AI configured `"strict": false` (to suppress strict mode errors) while simultaneously leaving `"exactOptionalPropertyTypes": true` active from the default template:

```json
// tsconfig.json — WRONG version produced by AI
{
  "compilerOptions": {
    "strict": false,
    "exactOptionalPropertyTypes": true
  }
}
```

**How it was caught:**
The Render build (and the local `npm run build` command run to verify) failed immediately with:

```
tsconfig.json(25,5): error TS5052: Option 'exactOptionalPropertyTypes' cannot
be specified without specifying option 'strictNullChecks'.
```

This error only appeared when the fresh `node_modules` was installed, because the local cache had previously compiled with a different effective config.

**What was changed:**
`exactOptionalPropertyTypes` was set to `false` since we explicitly disabled strict mode:

```json
// tsconfig.json — CORRECT
{
  "compilerOptions": {
    "strict": false,
    "exactOptionalPropertyTypes": false
  }
}
```

---

### Error #2: `"types": ["node"]` Caused the Error It Was Trying to Fix

**What the AI did:**
When trying to resolve `process` and `require` not being recognised in TypeScript, the AI added `"types": ["node"]` to `tsconfig.json`'s `compilerOptions`:

```json
// tsconfig.json — WRONG version produced by AI
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

The AI's reasoning was that explicitly listing `"node"` in the `types` array would ensure `@types/node` was picked up.

**How it was caught:**
The Render build failed with the exact opposite error:

```
error TS2688: Cannot find type definition file for 'node'.
  The file is in the program because:
    Entry point of type library 'node' specified in compilerOptions
```

The error revealed that the `types` field does not *add* type packages — it *restricts* which packages TypeScript looks for. If `@types/node` is not installed (which it wasn't, because it was in `devDependencies` and Render uses `--production`), explicitly listing it in `types` makes TypeScript throw a hard error instead of silently ignoring it.

**What was changed:**
The `"types": ["node"]` line was completely removed from `tsconfig.json`. `@types/node` was moved from `devDependencies` to `dependencies` so Render installs it on every build:

```json
// tsconfig.json — CORRECT (types field removed entirely)
{
  "compilerOptions": {
    "skipLibCheck": true
    // no "types" field — TypeScript auto-discovers @types/* packages
  }
}
```

---

### Error #3: PowerShell-Incompatible Shell Commands

**What the AI did:**
When instructing how to clean and reinstall `node_modules` locally, the AI provided standard Unix/bash commands that are invalid in Windows PowerShell:

```bash
# WRONG — bash syntax, fails in PowerShell
rm -rf node_modules
npm install && npm run build
```

**How it was caught:**
The user ran the commands in their Windows PowerShell terminal and received:

```
Remove-Item : A parameter cannot be found that matches parameter name 'rf'.
At line:1 char:4
+ rm -rf node_modules
+    ~~~
```

PowerShell's `rm` is an alias for `Remove-Item`, which does not accept Unix flags like `-rf`. Similarly, `&&` for command chaining is a bash feature that PowerShell does not support (it uses `;` instead).

**What was changed:**
All subsequent shell commands were rewritten for Windows PowerShell syntax:

```powershell
# CORRECT — PowerShell syntax
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

For chaining multiple commands in a single line, `;` was used instead of `&&`:
```powershell
# CORRECT PowerShell chaining
npm install; npx prisma generate; npm run build
```

---

### Error #4 (Bonus): `AuthRequest` Generic Signature Broke Route Params

**What the AI did:**
To fix the `AuthRequest` interface not properly extending Express `Request`, the AI initially made it a full generic type mirroring Express's own signature:

```typescript
// auth.middleware.ts — WRONG (overly complex generics)
export interface AuthRequest<
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends Record<string, any> = Record<string, any>
> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  user?: { userId: string };
}
```

**How it was caught:**
After this "fix", `npm run build` still failed with 15+ errors across all route files:

```
src/routes/groups.routes.ts(96,16): error TS2322: Type 'string | string[]' 
is not assignable to type 'string | StringFilter<"GroupMembership">'.
```

The problem was that without explicit generic arguments at the call site, TypeScript defaulted `P` to `ParamsDictionary` — which types `req.params.id` as `string | string[]`. Prisma's filters only accept `string`, not `string | string[]`.

**What was changed:**
The interface was simplified to extend `Request<any, any, any, any, any>` (which widens all params to `any`), and at each route handler where a Prisma query used a URL parameter, an explicit cast was added:

```typescript
// auth.middleware.ts — CORRECT (simple extension)
export interface AuthRequest extends Request {
  user?: { userId: string };
}
```

```typescript
// groups.routes.ts — explicit cast at each usage
const id = req.params.id as string; // cast added everywhere req.params was used in Prisma queries
```

---

## Reflection on AI-Assisted Development

Working with AI coding assistants significantly accelerated development — the full backend (6 route files, anomaly engine, balance calculator, split calculator, Prisma schema) was scaffolded in a single session. However, this project demonstrated that AI assistance requires active supervision:

1. **AI does not know your runtime environment.** Commands that work on Linux/macOS fail silently or with confusing errors on Windows PowerShell. The developer must always translate.

2. **AI applies general patterns that may conflict in your specific config.** The `"types": ["node"]` addition was technically correct advice in isolation but wrong for the Render production context.

3. **AI does not always verify assumptions about what is installed.** The `@types/csv-parser` package was suggested but does not exist on npm; the AI assumed it existed based on the naming convention of other `@types/*` packages.

4. **TypeScript type system interactions are subtle.** The `AuthRequest` generics fix required multiple iterations. The AI's first solution was technically valid TypeScript but triggered downstream type inference failures that required a second round of debugging.

The best results came from treating the AI as a senior pair-programmer whose code **always requires review before running**, and whose environment assumptions **must always be verified** against the actual project context.
