-- Migration 004: Add subscription tracking fields
-- Adds cancellation tracking and plan change history to firms table

-- Add cancellation tracking fields
ALTER TABLE firms
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancellation_scheduled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_effective_date TIMESTAMP;

-- Add plan change history fields
ALTER TABLE firms
ADD COLUMN IF NOT EXISTS previous_plan_id TEXT,
ADD COLUMN IF NOT EXISTS plan_changed_at TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN firms.cancel_at_period_end IS 'Whether the subscription is scheduled to cancel at the end of the billing period';
COMMENT ON COLUMN firms.cancellation_scheduled_at IS 'When the cancellation was scheduled (user clicked cancel)';
COMMENT ON COLUMN firms.cancellation_effective_date IS 'When the subscription will actually be cancelled (end of period)';
COMMENT ON COLUMN firms.previous_plan_id IS 'Previous Whop plan ID before the most recent plan change';
COMMENT ON COLUMN firms.plan_changed_at IS 'Timestamp of the most recent plan change (upgrade/downgrade)';
