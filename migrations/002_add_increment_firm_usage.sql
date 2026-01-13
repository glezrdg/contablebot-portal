-- Migration: Add increment_firm_usage function
-- Date: 2026-01-13
-- Description: Atomically increment firm usage counter on invoice upload

-- ============================================
-- 1. Create increment function for firm usage
-- ============================================

CREATE OR REPLACE FUNCTION increment_firm_usage(p_firm_id INTEGER, p_increment INTEGER DEFAULT 1)
RETURNS void AS $$
BEGIN
  UPDATE firms
  SET used_this_month = COALESCE(used_this_month, 0) + p_increment
  WHERE id = p_firm_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to PostgREST
GRANT EXECUTE ON FUNCTION increment_firm_usage(INTEGER, INTEGER) TO PUBLIC;

-- ============================================
-- Migration Complete
-- ============================================
