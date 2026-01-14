-- Migration: Add qa_feedback column and update claim_pending_invoices
-- Date: 2026-01-14
-- Description: Support QA review feedback for re-processing invoices

-- ============================================
-- 1. Add qa_feedback column to invoices table
-- ============================================

ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS qa_feedback TEXT;

COMMENT ON COLUMN invoices.qa_feedback IS 'Feedback from QA review for re-processing - contains previous validation issues';

-- ============================================
-- 2. Update claim_pending_invoices function to return qa_feedback
-- ============================================

-- Check if the function exists first - if it does, update it
-- Otherwise the user needs to create it

CREATE OR REPLACE FUNCTION claim_pending_invoices(batch_size INTEGER DEFAULT 5)
RETURNS TABLE (
  id INTEGER,
  firm_id INTEGER,
  user_id INTEGER,
  client_id INTEGER,
  client_name TEXT,
  rnc TEXT,
  raw_ocr_text TEXT,
  retry_count INTEGER,
  qa_feedback TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT i.id
    FROM invoices i
    WHERE (
      -- New pending invoices
      (i.status = 'pending' AND i.is_deleted = false)
      OR
      -- Error invoices eligible for retry (retry_count < 3, last attempt > 10 min ago)
      (i.status = 'error' AND i.is_deleted = false AND i.retry_count < 3
       AND i.processed_at < NOW() - INTERVAL '10 minutes')
    )
    ORDER BY i.created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE invoices inv
  SET status = 'processing', processed_at = NOW()
  FROM claimed
  WHERE inv.id = claimed.id
  RETURNING
    inv.id,
    inv.firm_id,
    inv.user_id,
    inv.client_id,
    inv.client_name,
    inv.rnc,
    inv.raw_ocr_text,
    COALESCE(inv.retry_count, 0) AS retry_count,
    inv.qa_feedback;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to PostgREST
GRANT EXECUTE ON FUNCTION claim_pending_invoices(INTEGER) TO PUBLIC;

-- ============================================
-- Migration Complete
-- ============================================
