# Directive: Add API Route

## Goal
Create a new API route in the Next.js Pages Router with proper authentication, error handling, and type safety.

## When to Use
- User requests a new API endpoint
- Adding new backend functionality
- Exposing data to the frontend

## Inputs
- **Endpoint path** (e.g., `/api/invoices/export`)
- **HTTP method** (GET, POST, DELETE, etc.)
- **Authentication required** (yes/no)
- **Request/response types** (TypeScript interfaces)
- **Database operations** (if any)

## Process

### 1. Analyze Existing Patterns
Before creating a new route, examine similar routes:
- Read `pages/api/invoices.ts` for GET request patterns
- Read `pages/api/login.ts` for POST request patterns
- Read `pages/api/invoices/[id].ts` for dynamic route patterns

### 2. Check Type Definitions
- Read `types/index.ts` to see if needed types exist
- If not, add new types following existing conventions
- Ensure request/response types are exported

### 3. Create the Route File
Location: `pages/api/[your-route].ts`

Standard structure:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1. Method guard
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Authentication (if required)
  const user = await requireAuth(req, res);
  if (!user) return; // requireAuth handles the response

  // 3. Input validation
  // Validate query params or body

  // 4. Business logic
  try {
    // Call PostgREST or other services
    const result = await fetch(/* ... */);

    return res.status(200).json({ data: result });
  } catch (error) {
    console.error('Error in [route]:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 4. Key Patterns for ContableBot Portal

**Authentication:**
```typescript
const user = await requireAuth(req, res);
if (!user) return;
const firmId = user.firm_id;
```

**PostgREST Queries:**
```typescript
const response = await fetch(
  `${process.env.POSTGREST_BASE_URL}/invoices?firm_id=eq.${firmId}&is_deleted=eq.false`,
  {
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }
);
```

**Multi-tenancy Filter:**
Always filter by `firm_id` to ensure data isolation:
```typescript
?firm_id=eq.${firmId}
```

**Soft Delete:**
Always filter out deleted records:
```typescript
&is_deleted=eq.false
```

### 5. Update Middleware (if needed)
If the route requires authentication, it should already be protected by middleware.
Check `middleware.ts` to ensure your route pattern is covered.

### 6. Test the Route
Use the execution script:
```bash
python execution/test_api.py http://localhost:3000 --endpoint /api/your-route --method GET
```

## Tools to Use
- **Read tool**: Study existing API routes
- **Edit/Write tools**: Create the new route file
- **execution/test_api.py**: Test the endpoint

## Edge Cases

### Case: Unauthenticated Request
- `requireAuth` will return null and send 401 response
- Early return to stop execution

### Case: Missing Environment Variable
- Always check `process.env.POSTGREST_BASE_URL` exists
- Return 500 with helpful error message

### Case: PostgREST Error
- PostgREST returns 400-500 status codes
- Log the full error response
- Return sanitized error to client

### Case: Invalid Input
- Validate query params/body before processing
- Return 400 with specific validation error

## Success Criteria
- [ ] Route file created in correct location
- [ ] Type definitions added/updated
- [ ] Authentication implemented (if required)
- [ ] Firm-based multi-tenancy enforced
- [ ] Error handling covers all cases
- [ ] Route tested with execution script
- [ ] No TypeScript errors

## Common Mistakes
1. Forgetting to filter by `firm_id` → data leakage
2. Not checking `is_deleted=eq.false` → showing deleted records
3. Not handling method guards → accepting wrong HTTP methods
4. Hardcoding values instead of using environment variables
5. Not returning early after `requireAuth` fails

## Learning Notes
(This section gets updated as we discover new patterns)

- PostgREST uses query params for filtering, not request body on GET
- The `Prefer: return=representation` header returns the created/updated record
- Dynamic routes use `[id].ts` naming convention
- Middleware runs before API routes, so authentication check happens twice (Edge + API)
