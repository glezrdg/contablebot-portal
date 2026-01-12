# User Module Implementation Guide

## ✅ Phase 1: Foundation (COMPLETED)

### 1. Database Schema
**File**: `migrations/001_add_user_module.sql`

Created:
- ✅ Modified `portal_users` table with `role`, `full_name`, `is_active`, `active_client_id`
- ✅ Created `user_clients` junction table for many-to-many user-client relationships
- ✅ Created `user_audit_log` table for tracking user actions
- ✅ Added helper functions: `get_user_accessible_clients()`, `user_has_client_access()`
- ✅ Added indexes for performance
- ✅ Auto-assigned existing admins to all their firm's clients

**To run migration**:
```sql
-- Connect to your PostgreSQL database and run:
psql -U your_user -d your_database -f migrations/001_add_user_module.sql
```

### 2. TypeScript Types
**File**: `types/index.ts`

Added:
- ✅ Updated `PortalUser` interface with role, active_client_id, etc.
- ✅ Created `UserClient` interface
- ✅ Created `UserAuditLog` interface
- ✅ Updated `JWTPayload` with role and activeClientId
- ✅ Updated `MeResponse` with user module fields
- ✅ Created `CreateUserRequest`, `UpdateUserRequest`, `UsersResponse`

### 3. Access Control Middleware
**File**: `lib/access-control.ts`

Created functions:
- ✅ `requireRole()` - Enforce role-based access
- ✅ `requireAdmin()` - Shorthand for admin-only routes
- ✅ `requirePlan()` - Enforce plan-based features (Pro+ for user module)
- ✅ `verifyClientAccess()` - Check if user can access a client
- ✅ `requireClientAccess()` - Enforce client access in API routes
- ✅ `getUserAccessibleClientIds()` - Get all clients user can access
- ✅ `auditLog()` - Log user actions for compliance

---

## 🚧 Phase 2: Backend API (NEXT STEPS)

### Step 1: Update Login Flow
**File to modify**: `pages/api/login.ts`

Changes needed:
1. Fetch user's assigned clients
2. Determine default active client
3. Include `role`, `activeClientId`, `assignedClientIds` in JWT

### Step 2: Update /api/me Endpoint
**File to modify**: `pages/api/me.ts`

Changes needed:
1. Return user role
2. Return active client information
3. Return list of assigned clients
4. Return plan key for feature gating

### Step 3: Create User Management Endpoints

#### POST /api/users (Create User)
- Validate admin role
- Validate Pro+ plan
- Hash password
- Create user in `portal_users`
- Assign clients in `user_clients`
- Audit log the creation

#### GET /api/users (List Users)
- Validate admin role
- Return all users in firm with their assigned clients

#### PATCH /api/users/[id] (Update User)
- Validate admin role
- Update user details
- Update client assignments
- Audit log the change

#### DELETE /api/users/[id] (Deactivate User)
- Validate admin role
- Set `is_active = false`
- Audit log the deactivation

### Step 4: Create Client Switching Endpoint

#### POST /api/me/switch-client
- Validate user has access to requested client
- Update `active_client_id` in database
- Generate new JWT with updated activeClientId
- Return new token

---

## 🎨 Phase 3: Frontend Implementation

### Step 1: Create Client Context
**File to create**: `contexts/ClientContext.tsx`

Provides:
- Current active client state
- List of assigned clients
- `switchClient(clientId)` function
- Wraps entire app in `_app.tsx`

### Step 2: Update AdminHeader
**File to modify**: `components/AdminHeader.tsx`

Add:
- Client switcher dropdown (if user has multiple clients)
- Show current active client
- Hide subscription management if role = 'user'

### Step 3: Create User Module Page
**File to create**: `pages/usuarios.tsx`

Features:
- List all users in firm (DataTable)
- Create new user button (opens modal)
- Edit user (inline or modal)
- Deactivate user
- Show/hide based on Pro+ plan
- Show/hide based on admin role

### Step 4: Create User Modals

#### CreateUserModal.tsx
- Email input
- Password input
- Full name input
- Client multi-select with checkboxes
- Default client radio buttons

#### EditUserModal.tsx
- Same as create but for editing
- Can change client assignments
- Can toggle active/inactive

### Step 5: Update Existing API Routes
**Files to modify**: All routes that query data

Add client filtering:
```typescript
// Before
const url = `${POSTGREST_BASE_URL}/invoices?firm_id=eq.${firmId}`;

// After
const url = `${POSTGREST_BASE_URL}/invoices?firm_id=eq.${firmId}&client_id=eq.${activeClientId}`;
```

Routes to update:
- `/api/invoices`
- `/api/invoices/[id]`
- `/api/invoices/upload`
- `/api/reports/stats`
- Any other data queries

### Step 6: Add Plan-Based Feature Gating

Hide "Usuarios" menu item if:
- Current plan < Pro
- Current role = 'user'

---

## 🔒 Security Checklist

- [ ] All user management endpoints require admin role
- [ ] User module requires Pro+ plan
- [ ] Client switching validates access
- [ ] All data queries filter by active_client_id
- [ ] Passwords are hashed with bcrypt
- [ ] JWT tokens are httpOnly cookies
- [ ] Audit log tracks all sensitive actions
- [ ] Users cannot escalate to admin role
- [ ] Cannot assign clients from other firms

---

## 🧪 Testing Scenarios

### Test 1: Admin creates user
1. Login as admin
2. Navigate to /usuarios
3. Click "Crear Usuario"
4. Fill form, assign 2 clients
5. Verify user created with correct role
6. Verify client assignments in database

### Test 2: User logs in with multiple clients
1. Login as newly created user
2. Verify default client is active
3. Check that only assigned clients' data is visible
4. Switch to second client
5. Verify data updates to show second client

### Test 3: User cannot access admin features
1. Login as user (not admin)
2. Verify /usuarios is not in menu
3. Try to access /usuarios directly → redirect/403
4. Try to call POST /api/users → 403

### Test 4: Plan enforcement
1. Downgrade firm to Business plan (< Pro)
2. Login as admin
3. Verify /usuarios is hidden
4. Try to access /usuarios → show upgrade message
5. Try to call POST /api/users → 403 with upgrade message

### Test 5: Client isolation
1. Login as user with access to Client A only
2. Verify cannot see Client B's invoices
3. Try to switch to Client B → 403
4. Verify audit log records attempt

---

## 📝 Implementation Order

**Recommended sequence**:

1. ✅ Run database migration
2. ✅ Verify types are correct
3. ⏳ Update login flow
4. ⏳ Update /api/me
5. ⏳ Create user management APIs
6. ⏳ Create client switching API
7. ⏳ Create ClientContext
8. ⏳ Update AdminHeader with client switcher
9. ⏳ Build /usuarios page
10. ⏳ Update all data APIs to filter by client
11. ⏳ Test thoroughly
12. ⏳ Deploy

---

## 💡 Usage Examples

### Example 1: Admin creates a user with 3 clients
```typescript
POST /api/users
{
  "email": "user@example.com",
  "password": "secure123",
  "fullName": "Juan Pérez",
  "clientIds": [1, 2, 3],
  "defaultClientId": 2
}
```

### Example 2: User switches active client
```typescript
POST /api/me/switch-client
{
  "clientId": 3
}

// Response:
{
  "success": true,
  "token": "new.jwt.token",
  "activeClientId": 3
}
```

### Example 3: Check if action requires Pro plan
```typescript
import { requirePlan } from '@/lib/access-control';

export default async function handler(req, res) {
  const result = await requirePlan(req, res, 'pro');
  if (!result) return; // Already sent 403

  const { user, firm } = result;
  // Proceed with user management logic
}
```

---

## 🐛 Common Issues & Solutions

### Issue: Migration fails on portal_users constraint
**Solution**: Ensure all existing users have a default role before adding NOT NULL constraint

### Issue: JWT too large (>4KB cookie limit)
**Solution**: Store only client IDs array, not full client objects. Fetch details on /api/me

### Issue: User sees data from wrong client after switching
**Solution**: Ensure all components re-fetch data when ClientContext activeClientId changes

### Issue: Admin cannot see all clients
**Solution**: Check that `user_clients` assignments include all clients for admins

---

## 📚 Next Steps After Basic Implementation

**Advanced features** (optional):
1. User permissions matrix (granular permissions beyond admin/user)
2. Team/department groupings
3. Client-specific user roles (e.g., "read-only for Client A, full access to Client B")
4. Session management dashboard
5. Force logout all sessions for a user
6. Two-factor authentication
7. IP whitelisting per user
8. Custom audit log reports

---

## 🎯 Key Metrics to Track

After implementation, monitor:
- Number of users created per firm
- Client switch frequency
- User login patterns
- Failed access attempts (audit log)
- Plan upgrade conversions (from feature gating prompts)

---

**Questions or issues?** Check the code comments in:
- `lib/access-control.ts` - Access control patterns
- `migrations/001_add_user_module.sql` - Database schema
- `types/index.ts` - Type definitions
