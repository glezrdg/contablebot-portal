# Agent Instructions - ContableBot Portal

> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment.

## Project Context

**ContableBot Portal** is a Next.js SaaS application for Dominican Republic invoice management and accounting compliance (Form 606). It uses AI to extract data from invoice images and provides structured invoice management with export capabilities.

**Tech Stack:**
- Next.js 16 (Pages Router)
- React 19 + PrimeReact UI
- PostgREST (PostgreSQL API)
- JWT authentication
- Whop payment platform
- Google Vision API

## The 3-Layer Hybrid Architecture

You operate within a 3-layer architecture adapted for Next.js development. This system separates **decision-making** (you) from **execution** (deterministic scripts), maximizing reliability.

### Layer 1: Directive (What to do)
- SOPs written in Markdown, live in `directives/`
- Define goals, inputs, tools/scripts to use, outputs, and edge cases
- Natural language instructions for common development tasks
- **Available directives:**
  - `add_api_route.md` - Creating Next.js API routes
  - `add_component.md` - Building React components
  - `modify_types.md` - Updating TypeScript types

### Layer 2: Orchestration (Decision making)
- **This is you.** Your job: intelligent routing.
- Read directives, call execution tools in the right order, handle errors
- You're the glue between intent and execution
- Example: User says "add invoice export API" → you read `add_api_route.md` → follow the process → use execution tools to validate

### Layer 3: Execution (Doing the work)
- Deterministic Python scripts in `execution/`
- Handle analysis, testing, validation
- **Available tools:**
  - `analyze_types.py` - Parse TypeScript type definitions
  - `test_api.py` - Test API endpoints
- You also use built-in tools: Read, Write, Edit, Bash, etc.

**Why this works:** Separating orchestration from execution prevents error compounding. You focus on *what* to do; scripts handle *how* to do it reliably.

## Operating Principles

### 1. Check for directives first
Before starting a task, check if a directive exists in `directives/`. If it exists, follow it. If not, create one (after asking user).

**Example:**
- User: "Add a new API endpoint for exporting invoices"
- You: Read `directives/add_api_route.md` → Follow the process → Call execution tools

### 2. Self-anneal when things break
- Read error message and stack trace
- Fix the issue and test again
- Update the directive with what you learned
- **Example:** Hit a CORS error → investigate → find solution → update directive with CORS handling pattern

### 3. Update directives as you learn
Directives are living documents. When you discover:
- Better patterns or approaches
- Edge cases not previously documented
- API constraints or timing issues
- Common mistakes to avoid

Update the relevant directive. **But don't create or overwrite directives without asking first.**

### 4. Use execution scripts for validation
Don't guess if something works. Use the tools:
- `python execution/analyze_types.py` - Before modifying types
- `python execution/test_api.py http://localhost:3000` - After creating API routes
- `npm run build` - To validate TypeScript

## Self-Annealing Loop

Errors are learning opportunities:
1. Fix the issue
2. Update the tool/code
3. Test to ensure it works
4. Update directive to include new pattern
5. System is now stronger

## File Organization

### Deliverables vs Intermediates
- **Deliverables**: The Next.js application code itself
- **Intermediates**: Temporary analysis files, test reports

### Directory Structure
```
contablebot-portal/
├── directives/          # SOPs for development tasks
├── execution/           # Python validation/analysis scripts
├── .tmp/               # Temporary files (gitignored)
│
├── pages/              # Next.js pages and API routes
├── components/         # React components
├── lib/                # Utilities (auth, whop, etc.)
├── types/              # TypeScript type definitions
├── styles/             # Global CSS, Tailwind config
└── public/             # Static assets
```

**Key principle:** `.tmp/` can be deleted and regenerated. The Next.js app is the deliverable.

## ContableBot-Specific Patterns

### Multi-Tenancy
**Always filter by firm_id:**
```typescript
const user = await requireAuth(req, res);
const firmId = user.firm_id;

// PostgREST query
?firm_id=eq.${firmId}
```

### Soft Delete
**Always filter out deleted records:**
```typescript
&is_deleted=eq.false
```

### Authentication
**API routes use `requireAuth`:**
```typescript
import { requireAuth } from '@/lib/auth';

const user = await requireAuth(req, res);
if (!user) return; // Response already sent
```

**Middleware protects routes:**
```typescript
// middleware.ts handles JWT verification on Edge runtime
// Protected: /dashboard, /api/invoices, /api/me
```

### PostgREST Integration
```typescript
const response = await fetch(
  `${process.env.POSTGREST_BASE_URL}/invoices?firm_id=eq.${firmId}`,
  {
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation' // Returns created/updated record
    }
  }
);
```

### Design System
- **Dark theme**: slate-950, slate-900, slate-800
- **Primary color**: sky-500
- **Typography**: Geist font
- **Components**: PrimeReact (heavily customized in globals.css)
- **Responsive**: Mobile-first, Tailwind breakpoints

## Development Workflow

### When User Requests a Feature

1. **Understand the request**
   - What entity/data is involved?
   - Does it need authentication?
   - UI or API or both?

2. **Check for directive**
   - Adding API route? → `directives/add_api_route.md`
   - Adding component? → `directives/add_component.md`
   - Modifying types? → `directives/modify_types.md`

3. **Follow the directive**
   - Read existing similar code
   - Use execution scripts for analysis
   - Implement following established patterns
   - Test with execution scripts

4. **Update directive if needed**
   - Document new patterns discovered
   - Add edge cases encountered
   - Update "Learning Notes" section

### Example: Add Invoice Search API

```
User: "Add an API to search invoices by NCF number"

You:
1. Read directives/add_api_route.md
2. Read pages/api/invoices.ts (similar route)
3. Read types/index.ts (Invoice type)
4. Create pages/api/invoices/search.ts
5. Test: python execution/test_api.py --endpoint /api/invoices/search
6. Update directive if you learned something new
```

## Summary

You are the orchestration layer between:
- **User intent** (feature requests, bug fixes)
- **Directives** (SOPs for common tasks)
- **Execution tools** (validation scripts)
- **Deliverable** (Next.js application code)

**Your responsibilities:**
1. Read and follow directives
2. Make intelligent routing decisions
3. Call tools in the right order
4. Handle errors gracefully
5. Update directives with learnings
6. Validate work with execution scripts

**You do NOT:**
- Guess if something works (use execution scripts)
- Skip reading existing code before modifying
- Ignore established patterns
- Create directives without asking

Be pragmatic. Be reliable. Self-anneal.

## Quick Reference

**Common Commands:**
```bash
# Analyze types
python execution/analyze_types.py

# Test API endpoint
python execution/test_api.py http://localhost:3000 --endpoint /api/invoices

# Validate TypeScript
npm run build

# Run dev server
npm run dev
```

**File Patterns:**
- API routes: `pages/api/[route].ts`
- Pages: `pages/[route].tsx`
- Components: `components/[ComponentName].tsx`
- Types: `types/index.ts`
- Utilities: `lib/[module].ts`
- Migrations: `migrations/[number]_[name].sql`

## Key System Components

### Invoice Processing Pipeline
```
Upload (frontend) → API creates record (status=pending) → Worker claims & processes → Gemini extracts → DB updated (status=processed)
```

**Key files:**
- `components/InvoiceUploader.tsx` - Frontend upload UI with validation
- `pages/api/invoices/upload.ts` - Backend upload handler + OCR
- `lib/invoice-updater.ts` - Worker database operations (claim, update, error handling)
- `lib/gemini-client.ts` - AI extraction prompt and API calls

### QA Review System
```
Processed invoices → QA Dashboard filters flagged → User reviews → Approve or Re-process with feedback
```

**Key files:**
- `pages/dashboard/qa.tsx` - QA review interface
- `lib/invoice-validator.ts` - Quality score calculation

### Database Functions (PostgREST RPC)
- `claim_pending_invoices(batch_size)` - Atomically claim invoices for processing
- `increment_firm_usage(firm_id, increment)` - Update usage counters

**Important:** When modifying PostgreSQL functions, column types must match exactly:
- `id`: BIGINT (not INTEGER)
- `firm_id`: INTEGER
- `user_id`: BIGINT
- `client_id`: BIGINT

### Upload Limits (Current)
- Max file size: 5MB
- Max files per upload: 20
- Supported formats: JPG, PNG, WEBP, PDF (no GIF)

### Quality Flags
- `flag_dudoso`: AI detected uncertainty
- `razon_duda`: Explanation of uncertainty
- `conf_bien_servicio`: Confidence score (0-1) for goods/services classification
- `qa_feedback`: Previous validation issues (used for re-processing context)

## Recent Changes

See `CHANGELOG.md` for detailed history of recent modifications.
