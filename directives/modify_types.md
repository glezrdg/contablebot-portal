# Directive: Modify TypeScript Types

## Goal
Update TypeScript type definitions in `types/index.ts` to reflect database schema changes or new features.

## When to Use
- Database schema changes
- New API endpoints with new data structures
- Refactoring existing types
- Adding new entities

## Inputs
- **Type/Interface name**
- **New fields to add** (or fields to remove)
- **Field types and optionality**
- **Related types** that might need updates

## Process

### 1. Read Current Types
Always start by reading the current types file:
```
Read: types/index.ts
```

### 2. Understand the Type System

**Core Entities in ContableBot:**
- `Firm` - Organization/company
- `PortalUser` - Login credentials
- `Invoice` - Main data entity (606 format)
- `Client` - Invoice client/vendor
- `User` - Telegram bot user

**Type Hierarchy:**
```
Firm (has many)
  ├── PortalUsers
  ├── Invoices
  └── Clients (derived from Invoices)
```

### 3. Analyze Before Modifying
Use the execution script to understand current structure:
```bash
python execution/analyze_types.py
```

This outputs JSON report of all types and their fields.

### 4. Make the Modification

**Adding a Field:**
```typescript
export interface Invoice {
  // Existing fields...
  new_field: string;           // Required field
  optional_field?: number;     // Optional field
  nullable_field: string | null; // Can be null
}
```

**Making a Field Optional:**
```typescript
// Before
export interface Firm {
  plan_id: string;
}

// After
export interface Firm {
  plan_id?: string; // Now optional
}
```

**Adding a New Type:**
```typescript
// Add after existing types
export interface NewEntity {
  id: number;
  firm_id: number;
  created_at: string;
  // Other fields
}
```

### 5. Common Type Patterns

**Database Entity Pattern:**
```typescript
export interface EntityName {
  id: number;              // Primary key
  firm_id: number;         // Multi-tenancy
  created_at: string;      // Timestamp
  updated_at?: string;     // Optional timestamp
  is_deleted?: boolean;    // Soft delete
  // Business fields
}
```

**API Response Pattern:**
```typescript
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Usage
export type InvoicesResponse = ApiResponse<Invoice[]>;
```

**Enum Pattern:**
```typescript
export type InvoiceStatus = 'pending' | 'processed' | 'error';
```

### 6. Database-TypeScript Type Mapping

| Database Type | TypeScript Type |
|--------------|----------------|
| integer, bigint | number |
| text, varchar | string |
| boolean | boolean |
| timestamp, timestamptz | string |
| json, jsonb | object or specific interface |
| array | Type[] |
| nullable columns | Type \| null |

### 7. Validate Changes

After modifying types, check for errors:
```bash
# In terminal
npm run build
```

This will catch any type mismatches in the codebase.

### 8. Update Related Files

**If Invoice type changed:**
- Check: `pages/dashboard.tsx` (uses Invoice)
- Check: `pages/api/invoices.ts` (returns Invoice[])

**If Firm type changed:**
- Check: `pages/api/me.ts` (returns Firm)
- Check: Any components using firm data

## Tools to Use
- **Read tool**: Read `types/index.ts`
- **Edit tool**: Modify the types
- **execution/analyze_types.py**: Understand current structure
- **Bash tool**: Run `npm run build` to validate

## Edge Cases

### Case: Field Name Change
If renaming a field:
1. Search codebase for old field name: `Grep: old_field_name`
2. Update all usages
3. Update type definition
4. Test affected components

### Case: Breaking Change
If removing a field or making non-optional field required:
1. Search for all usages
2. Update code to handle the change
3. Consider migration strategy for existing data

### Case: Complex Nested Types
For nested objects:
```typescript
export interface Invoice {
  metadata: {
    vision_data?: {
      text: string;
      confidence: number;
    };
    user_verified?: boolean;
  };
}
```

## Success Criteria
- [ ] Type definition matches database schema
- [ ] All fields have correct types
- [ ] Optional vs required fields are correct
- [ ] No TypeScript compilation errors
- [ ] Related code updated if needed

## Common Mistakes
1. Making required DB fields optional in TypeScript
2. Using `any` type instead of proper types
3. Not updating code that uses the modified type
4. Inconsistent naming (DB: snake_case, TS: camelCase)
5. Forgetting to export new types

## Learning Notes
(This section gets updated as we discover new patterns)

- ContableBot uses snake_case for all database fields (matches PostgREST)
- Dates are stored as strings (ISO 8601 format)
- The `?` operator means optional, not nullable (use `| null` for nullable)
- PostgREST returns arrays, so API responses are usually `Type[]`
