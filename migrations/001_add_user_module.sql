-- Migration: Add User Module with Role-Based Access Control
-- Date: 2026-01-12
-- Description: Adds support for multi-user access with roles (admin/user) and client assignments

-- Enable required extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================
-- 1. Add role column to existing portal_users table
-- ============================================

-- Add role column (defaults to 'admin' for existing users)
ALTER TABLE portal_users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'user'));

-- Add metadata columns
ALTER TABLE portal_users
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES portal_users(id),
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing users to be admins
UPDATE portal_users SET role = 'admin' WHERE role IS NULL;

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_portal_users_role ON portal_users(role);
CREATE INDEX IF NOT EXISTS idx_portal_users_firm_role ON portal_users(firm_id, role);

-- ============================================
-- 2. Create user_clients junction table
-- ============================================

CREATE TABLE IF NOT EXISTS user_clients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by INTEGER REFERENCES portal_users(id),

  -- Ensure unique user-client pairs
  UNIQUE(user_id, client_id),

  -- Ensure only one default client per user
  EXCLUDE USING gist (user_id WITH =) WHERE (is_default = true)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_clients_user_id ON user_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_user_clients_client_id ON user_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_user_clients_default ON user_clients(user_id) WHERE is_default = true;

-- Grant permissions to PostgREST role
-- NOTE: Using PUBLIC for simplicity - in production, restrict to specific PostgREST role
GRANT SELECT, INSERT, UPDATE, DELETE ON user_clients TO PUBLIC;
GRANT USAGE, SELECT ON SEQUENCE user_clients_id_seq TO PUBLIC;

-- Also grant on user_audit_log table
GRANT SELECT, INSERT ON user_audit_log TO PUBLIC;
GRANT USAGE, SELECT ON SEQUENCE user_audit_log_id_seq TO PUBLIC;

-- ============================================
-- 3. Add active_client_id to portal_users
-- ============================================

-- Store the currently active client for each user session
ALTER TABLE portal_users
  ADD COLUMN IF NOT EXISTS active_client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_portal_users_active_client ON portal_users(active_client_id);

-- ============================================
-- 4. Create audit log table
-- ============================================

CREATE TABLE IF NOT EXISTS user_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- 'user.created', 'client.switched', 'invoice.created', etc.
  resource_type VARCHAR(50), -- 'invoice', 'client', 'user'
  resource_id INTEGER,
  metadata JSONB, -- Additional context
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON user_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON user_audit_log(action);

-- ============================================
-- 5. Add user tracking to invoices
-- ============================================

-- Track which user created/updated each invoice
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER REFERENCES portal_users(id),
  ADD COLUMN IF NOT EXISTS updated_by_user_id INTEGER REFERENCES portal_users(id);

CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON invoices(created_by_user_id);

-- ============================================
-- 6. Helper function: Get user's accessible clients
-- ============================================

CREATE OR REPLACE FUNCTION get_user_accessible_clients(p_user_id INTEGER)
RETURNS TABLE (
  client_id INTEGER,
  client_name VARCHAR(255),
  client_rnc VARCHAR(20),
  is_default BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.rnc,
    uc.is_default
  FROM clients c
  INNER JOIN user_clients uc ON c.id = uc.client_id
  WHERE uc.user_id = p_user_id
  ORDER BY uc.is_default DESC, c.name ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Helper function: Check if user has access to client
-- ============================================

CREATE OR REPLACE FUNCTION user_has_client_access(p_user_id INTEGER, p_client_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Admins have access to all clients in their firm
  SELECT EXISTS (
    SELECT 1 FROM portal_users
    WHERE id = p_user_id AND role = 'admin'
  ) INTO has_access;

  IF has_access THEN
    RETURN TRUE;
  END IF;

  -- Regular users need explicit assignment
  SELECT EXISTS (
    SELECT 1 FROM user_clients
    WHERE user_id = p_user_id AND client_id = p_client_id
  ) INTO has_access;

  RETURN has_access;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Trigger: Auto-update updated_at on portal_users
-- ============================================

CREATE OR REPLACE FUNCTION update_portal_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_portal_users_updated_at
  BEFORE UPDATE ON portal_users
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_users_updated_at();

-- ============================================
-- 9. Seed default client assignments for existing admins
-- ============================================

-- For each existing admin user, assign all clients in their firm as accessible
INSERT INTO user_clients (user_id, client_id, is_default, assigned_by)
SELECT
  pu.id AS user_id,
  c.id AS client_id,
  (ROW_NUMBER() OVER (PARTITION BY pu.id ORDER BY c.created_at ASC) = 1) AS is_default,
  pu.id AS assigned_by -- Self-assigned
FROM portal_users pu
CROSS JOIN clients c
WHERE pu.firm_id = c.firm_id
  AND pu.role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_clients uc
    WHERE uc.user_id = pu.id AND uc.client_id = c.id
  );

-- Set active_client_id for existing users to their default client
UPDATE portal_users pu
SET active_client_id = (
  SELECT uc.client_id
  FROM user_clients uc
  WHERE uc.user_id = pu.id AND uc.is_default = true
  LIMIT 1
)
WHERE pu.active_client_id IS NULL AND pu.role IN ('admin', 'user');

-- ============================================
-- 10. Grants (PostgREST requires explicit permissions)
-- ============================================

-- Grant access to new tables (adjust role name as needed)
-- Replace 'api_user' with your PostgREST role if different
GRANT SELECT, INSERT, UPDATE, DELETE ON user_clients TO api_user;
GRANT SELECT, INSERT ON user_audit_log TO api_user;
GRANT USAGE, SELECT ON SEQUENCE user_clients_id_seq TO api_user;
GRANT USAGE, SELECT ON SEQUENCE user_audit_log_id_seq TO api_user;
GRANT EXECUTE ON FUNCTION get_user_accessible_clients(INTEGER) TO api_user;
GRANT EXECUTE ON FUNCTION user_has_client_access(INTEGER, INTEGER) TO api_user;

-- ============================================
-- Migration Complete
-- ============================================

-- Verification queries (run these to verify migration):
-- SELECT * FROM portal_users LIMIT 5;
-- SELECT * FROM user_clients LIMIT 10;
-- SELECT * FROM get_user_accessible_clients(1); -- Replace 1 with actual user ID
-- SELECT user_has_client_access(1, 1); -- Replace with actual IDs
